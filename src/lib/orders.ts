import { createClient } from '@supabase/supabase-js'
// import Stripe from 'stripe'
import { getStripe } from './stripe'
import { sendOrderConfirmation } from './resend'
import { processXpForPurchase, processXpForReferral } from './gamification'
import {
    createOrder as createPrintfulOrder,
    getDefaultPrintFileUrl,
    isPrintfulConfigured,
} from './printful'
import { revalidatePath } from 'next/cache'

import { getAdminClient } from './supabase/admin'

/**
 * Processes a successful Stripe checkout session.
 * Created to be shared between the Stripe Webhook and a manual "Sync" action on the success page.
 */
export async function processSuccessfulCheckout(sessionId: string) {
    console.log(`[OrderProcess] Starting checkout processing for session: ${sessionId}`)

    const stripe = getStripe()
    if (!stripe) throw new Error('Stripe not configured')

    const supabase = getAdminClient()
    if (!supabase) {
        console.error('[OrderProcess] CRITICAL: Admin Supabase client not configured (Missing service role key?)')
        throw new Error('Database admin access not configured')
    }

    // 1. Check if order already exists
    const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', sessionId)
        .maybeSingle()

    if (existingOrder) {
        console.log(`[OrderProcess] Order already processed for session: ${sessionId} (Order ID: ${existingOrder.id})`)
        return { ok: true, orderId: existingOrder.id, alreadyProcessed: true }
    }

    // 2. Retrieve full session details
    console.log('[OrderProcess] Retrieving session from Stripe...')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fullSession: any = await stripe.checkout.sessions.retrieve(sessionId)

    if (fullSession.status !== 'complete' && fullSession.status !== 'open') {
        console.warn(`[OrderProcess] Session status is ${fullSession.status}, aborting.`)
        throw new Error(`Session status is ${fullSession.status}, not ready for processing.`)
    }

    // 3. Fetch cart items from abandoned_checkouts
    console.log('[OrderProcess] Recovering cart from abandoned_checkouts...')
    const { data: checkoutData, error: abandonedError } = await supabase
        .from('abandoned_checkouts')
        .select('cart_summary')
        .eq('stripe_session_id', sessionId)
        .maybeSingle()

    if (abandonedError) {
        console.error('[OrderProcess] Failed to fetch abandoned_checkout:', abandonedError)
    }

    if (!checkoutData?.cart_summary) {
        console.error(`[OrderProcess] CRITICAL: Missing abandoned_checkout record for session: ${sessionId}. Cart recovery impossible.`)
        throw new Error('Missing abandoned_checkout record (required for cart recovery)')
    }

    console.log('[OrderProcess] Checkout data recovered successfully')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cartSummary = checkoutData.cart_summary as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cartItems = (cartSummary.items || []).map((item: any) => ({
        ...item,
        quantity: Number(item.quantity)
    }))
    const totalCents = Number(cartSummary.totalCents || fullSession.metadata?.totalCents || 0)

    // 4. Extract shipping details
    const shippingDetails = fullSession.shipping_details || fullSession.customer_details?.shipping
    const address = shippingDetails?.address
    const shippingAddressJson = address
        ? {
            name: shippingDetails.name ?? '',
            address: {
                line1: address.line1 ?? '',
                line2: address.line2 ?? '',
                city: address.city ?? '',
                postalCode: address.postal_code ?? '',
                country: address.country ?? '',
                state: address.state ?? '',
            },
        }
        : null

    const discountId = fullSession.metadata?.discount_id ?? null
    const discountCents = fullSession.metadata?.discount_cents
        ? parseInt(fullSession.metadata.discount_cents, 10)
        : 0

    const userId = fullSession.metadata?.user_id ?? null
    const guestEmail = fullSession.metadata?.guest_email || fullSession.customer_email || fullSession.customer_details?.email

    // 5. Create Order
    console.log('[OrderProcess] Creating order in database...')
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: userId || null,
            guest_email: guestEmail ?? null,
            status: 'paid',
            total_cents: totalCents,
            currency: 'CHF',
            stripe_session_id: sessionId,
            shipping_address_json: shippingAddressJson,
            discount_id: discountId || null,
            discount_cents: Number.isFinite(discountCents) ? discountCents : 0,
        })
        .select('id')
        .single()

    if (orderError) {
        console.error('[OrderProcess] Order creation failed:', orderError)
        throw orderError
    }

    console.log(`[OrderProcess] Order created: ${order.id}`)

    // Cleanup
    await supabase.from('abandoned_checkouts').delete().eq('stripe_session_id', sessionId)

    // Increment discount uses
    if (discountId) {
        const { data: disc } = await supabase.from('discounts').select('use_count').eq('id', discountId).single()
        if (disc) {
            await supabase.from('discounts').update({ use_count: (disc.use_count ?? 0) + 1 }).eq('id', discountId)
        }
    }

    // Create Order Items
    console.log('[OrderProcess] Creating order items...')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderItems = cartItems.map((item: any) => ({
        order_id: order.id,
        variant_id: item.variantId,
        quantity: item.quantity,
        price_cents: item.priceCents,
        config: item.config ?? {},
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

    if (itemsError) {
        console.error('[OrderProcess] Order items creation failed:', itemsError)
        throw itemsError
    }

    // Inventory Management & Social Proof
    const productSlugsToRevalidate = new Set<string>()
    const location = shippingAddressJson?.address?.city && shippingAddressJson?.address?.country
        ? `${shippingAddressJson.address.city}, ${shippingAddressJson.address.country}`
        : shippingAddressJson?.address?.country || null

    for (const item of cartItems) {
        // Inventory decrement
        const { data: inv } = await supabase.from('product_inventory').select('quantity').eq('variant_id', item.variantId).single()
        if (inv) {
            await supabase.from('product_inventory').update({ quantity: Math.max(0, inv.quantity - item.quantity) }).eq('variant_id', item.variantId)
        }

        // Social proof
        await supabase.from('recent_purchases').insert({
            product_id: item.productId,
            variant_id: item.variantId,
            location,
        })

        // Metadata for revalidation
        const { data: p } = await supabase.from('products').select('slug').eq('id', item.productId).single()
        if (p?.slug) productSlugsToRevalidate.add(p.slug)
    }

    // Cache invalidation
    for (const slug of productSlugsToRevalidate) {
        try { revalidatePath(`/products/${slug}`) } catch (_) { }
    }

    // Gamification
    if (userId) {
        console.log('[OrderProcess] Processing gamification for user:', userId)
        await processXpForPurchase(supabase, userId, order.id, totalCents)
        const { data: referral } = await supabase
            .from('referrals')
            .select('id, referrer_id')
            .eq('referred_user_id', userId)
            .is('first_order_id', null)
            .maybeSingle()
        if (referral?.referrer_id) {
            await supabase.from('referrals').update({ first_order_id: order.id }).eq('id', referral.id)
            await processXpForReferral(supabase, referral.referrer_id)
            await supabase.from('referrals').update({ referrer_xp_awarded_at: new Date().toISOString() }).eq('id', referral.id)
        }
    }

    // Notification
    const email = guestEmail ?? undefined
    if (email) {
        console.log('[OrderProcess] Sending confirmation email...')
        await sendOrderConfirmation({
            to: email,
            orderId: order.id,
            totalCents,
            currency: 'CHF',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            itemCount: cartItems.reduce((s: number, i: any) => s + i.quantity, 0),
        })
    }

    // Printful Fulfillment
    console.log('[OrderProcess] Starting Printful fulfillment...')
    if (isPrintfulConfigured() && shippingAddressJson?.address) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const variantIds = cartItems.map((c: any) => c.variantId)
            const { data: variants } = await supabase
                .from('product_variants')
                .select('id, printful_variant_id, printful_sync_variant_id')
                .in('id', variantIds)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const printfulItems: any[] = []
            for (const item of cartItems) {
                const v = (variants ?? []).find((x) => x.id === item.variantId)
                if (!v) continue

                if (v.printful_sync_variant_id != null) {
                    printfulItems.push({
                        sync_variant_id: v.printful_sync_variant_id,
                        quantity: item.quantity,
                        retail_price: (item.priceCents / 100).toFixed(2),
                    })
                } else if (v.printful_variant_id != null) {
                    printfulItems.push({
                        variant_id: v.printful_variant_id,
                        quantity: item.quantity,
                        files: [{ url: getDefaultPrintFileUrl() }],
                        retail_price: (item.priceCents / 100).toFixed(2),
                    })
                }
            }

            if (printfulItems.length > 0) {
                console.log(`[OrderProcess] Sending ${printfulItems.length} items to Printful...`)
                const addr = shippingAddressJson.address
                const pfResult = await createPrintfulOrder({
                    recipient: {
                        name: shippingAddressJson.name || 'Customer',
                        address1: addr.line1,
                        city: addr.city,
                        state_code: addr.state || undefined,
                        country_code: addr.country,
                        zip: addr.postalCode,
                        email: email ?? undefined,
                    },
                    items: printfulItems,
                    external_id: order.id.replace(/-/g, ''),
                }, false)

                if (pfResult.ok && pfResult.printfulOrderId) {
                    console.log(`[OrderProcess] Printful Order Created: ${pfResult.printfulOrderId}`)
                    await supabase.from('orders').update({ printful_order_id: pfResult.printfulOrderId }).eq('id', order.id)
                } else {
                    console.error('[OrderProcess] Printful fulfillment failed:', pfResult.error)
                }
            }
        } catch (pfErr) {
            console.error('[OrderProcess] Printful fulfillment crash:', pfErr)
        }
    } else {
        console.warn('[OrderProcess] Printful fulfillment skipped: Config missing or no shipping address')
    }

    console.log('[OrderProcess] Synchronization complete successfully')
    return { ok: true, orderId: order.id }
}

// Helper for simple existence check without heavy processing (used by polling)
export async function checkOrderExists(sessionId: string) {
    const supabase = getAdminClient()
    if (!supabase) return null

    const { data } = await supabase
        .from('orders')
        .select('id, status')
        .eq('stripe_session_id', sessionId)
        .maybeSingle()

    return data
}

