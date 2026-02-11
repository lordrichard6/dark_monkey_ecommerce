/**
 * VAPID Keys Generator for Web Push Notifications
 * Run once to generate keys, then add to .env.local
 */

const crypto = require('crypto')

function generateVAPIDKeys() {
    const keyPair = crypto.generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
    })

    const publicKey = keyPair.publicKey
        .export({ type: 'spki', format: 'der' })
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

    const privateKey = keyPair.privateKey
        .export({ type: 'pkcs8', format: 'der' })
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

    return { publicKey, privateKey }
}

console.log('\n🔐 VAPID Keys Generator\n')
console.log('Generating VAPID key pair for web push notifications...\n')

const keys = generateVAPIDKeys()

console.log('✅ Keys generated successfully!\n')
console.log('Add these to your .env.local file:\n')
console.log('# Web Push Notifications (VAPID Keys)')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log('\n⚠️  IMPORTANT: Keep the private key secret! Never commit to git.\n')
console.log('Add to .env.local (already in .gitignore)\n')
