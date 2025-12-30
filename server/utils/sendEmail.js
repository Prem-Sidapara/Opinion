const { Resend } = require('resend');

const sendEmail = async (to, subject, text) => {
    // 1. Try Resend (API) - The Best Way
    if (process.env.RESEND_API_KEY) {
        try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from: 'onboarding@resend.dev', // Default testing domain
                to: to,
                subject: subject,
                text: text,
            });
            console.log(`📧 Email sent to ${to} via Resend`);
            return true;
        } catch (error) {
            console.error('Resend API failed:', error);
            // Fall through to console logging...
        }
    }

    // 2. Fallback: Log to console (Fail safe)
    console.log('---------------------------------------------------');
    console.log(`⚠️  EMAIL FALLBACK (Resend not verified or failed)`);
    console.log(`📨 To: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`TEXT BODY:`);
    console.log(text);
    console.log('---------------------------------------------------');
    return true;
};

module.exports = sendEmail;
