
import dotenv from 'dotenv';
import path from 'path';
import { Resend } from 'resend';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'; // Default to test sender if not set

if (!RESEND_API_KEY) {
    throw new Error('❌ RESEND_API_KEY is missing from .env.local');
}

const resend = new Resend(RESEND_API_KEY);

const TEST_EMAIL = 'paulolopes@lopes2tech.ch'; // Hardcoded for diagnostic as per user context

async function main() {
    console.log('📧 Starting Email Diagnostic...');
    console.log(`🔑 API Key found (length: ${RESEND_API_KEY?.length ?? 0})`);
    console.log(`📨 Sending from: ${RESEND_FROM}`);
    console.log(`To: ${TEST_EMAIL}`);

    try {
        const { data, error } = await resend.emails.send({
            from: RESEND_FROM,
            to: TEST_EMAIL,
            subject: 'Diagnostic Test: Email Configuration',
            html: '<p>This is a test email from the <strong>Diagnostic Script</strong>. If you utilize this, your email configuration is correct.</p>'
        });

        if (error) {
            console.error('❌ Failed to send email:', error);
        } else {
            console.log('✅ Email sent successfully!');
            console.log(`   ID: ${data?.id}`);
        }
    } catch (e) {
        console.error('❌ Exception sending email:', e);
    }
}

main().catch(console.error);
