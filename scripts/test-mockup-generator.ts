

const API_BASE = 'https://api.printful.com'
const TOKEN = process.env.PRINTFUL_API_TOKEN

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function run() {
    if (!TOKEN) {
        console.error('Missing PRINTFUL_API_TOKEN')
        return
    }

    console.log('Starting Mockup Generation PoC...')

    // 1. Definition of what to generate
    // Product: Cotton Heritage M2580 (ID 380)
    // Variant: Navy Blazer / S (ID 11491)
    const productId = 380
    const variantId = 11491

    // Print Files (from previous debug)
    // These are the raw design files provided by the user
    const frontPrintUrl = 'https://files.cdn.printful.com/files/33f/33fd2f09b543d4d07e3c0e1ac5143f61_preview.png'
    const backPrintUrl = 'https://files.cdn.printful.com/files/cf5/cf5e6b3780cb0bfa1102bba22dc7bb9d_preview.png'

    // Construct the payload
    // We want: Front, Back, and maybe some context/lifestyle if available
    // To get specific views, we use 'option_groups' or just let it generate default 'placements'
    // Placements for this product (from debug): 'front', 'back', 'label_outside', 'label_inside', 'sleeve_left', ...
    // There is no explicit "lifestyle" placement usually; they are handled via 'option_groups' or styles in the 'mockup_templates'
    // For now, let's request 'front' and 'back' placements explicitly.

    const payload = {
        products: [
            {
                source: 'catalog',
                catalog_product_id: productId,
                catalog_variant_ids: [variantId],
                format: 'jpg',
                width: 1000,
                product_options: {
                    // "lifelike": true // Sometimes enables model views
                },
                // Define the files to be placed
                placements: [
                    {
                        placement: 'front',
                        technique: 'DTG',
                        layers: [
                            {
                                type: 'file',
                                url: frontPrintUrl,
                                // Removing explicit position to use defaults/fit
                            }
                        ]
                    },
                    {
                        placement: 'back',
                        technique: 'DTG',
                        layers: [
                            {
                                type: 'file',
                                url: backPrintUrl,
                                // Removing explicit position to use defaults/fit
                            }
                        ]
                    }
                ]
            }
        ]
    }

    console.log('Sending generation task (v2)...')
    const res = await fetch(`${API_BASE}/v2/mockup-tasks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    const data = await res.json()

    if (!res.ok) {
        console.error('Failed to create task:', JSON.stringify(data, null, 2))
        return
    }

    console.log('Response:', JSON.stringify(data, null, 2))

    // v2 response is { data: [ { id: ... } ] }
    const taskId = data.data?.[0]?.id || data.id || data.result?.task_key

    if (!taskId) {
        console.error('Could not find task ID in response')
        return
    }

    console.log(`Task created! ID: ${taskId}`)
    console.log('Waiting for completion...')

    // Poll for status
    let attempts = 0
    while (attempts < 20) {
        await sleep(2000)
        attempts++

        // v2 polling endpoint: GET /v2/mockup-tasks?id={id}
        const pollRes = await fetch(`${API_BASE}/v2/mockup-tasks?id=${taskId}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        })
        const pollData = await pollRes.json()

        // v2 status might be inside 'result' or 'data' array or root
        const status = pollData.status || pollData.data?.status || pollData.result?.status || pollData.data?.[0]?.status

        if (!status) {
            console.log('Unknown status structure:', JSON.stringify(pollData, null, 2))
        }

        if (status === 'completed') {
            console.log('Generation Complete!')
            console.log('Full Result:', JSON.stringify(pollData, null, 2))
            return
        } else if (status === 'failed') {
            console.error('Task failed:', JSON.stringify(pollData, null, 2))
            return
        } else {
            console.log(`Status: ${status}...`)
        }
    }
    console.log('Timed out waiting for generation')
}

run()
