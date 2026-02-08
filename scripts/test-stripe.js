const Stripe = require('stripe');
// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function testStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    console.log('Testing Stripe Key...');
    console.log('Key prefix:', key ? key.substring(0, 7) : 'MISSING');

    if (!key) {
        console.error('ERROR: No STRIPE_SECRET_KEY found in .env.local');
        return;
    }

    const stripe = new Stripe(key, {
        apiVersion: '2025-01-27.acacia',
        timeout: 30000,
    });

    try {
        const account = await stripe.accounts.retrieve();
        console.log('SUCCESS! Connected to Stripe account.');
        console.log('Account ID:', account.id);
        console.log('Email:', account.email);
    } catch (err) {
        console.error('CONNECTION FAILED');
        console.error('Error:', err.message);
        if (err.type) console.error('Type:', err.type);
    }
}

testStripe();
