const SibApiV3Sdk = require('sib-api-v3-sdk');

const sendEmail = async (to, subject, text) => {
    // 1. Try Brevo (Sendinblue) - Real Emails for Free
    if (process.env.BREVO_API_KEY) {
        try {
            const defaultClient = SibApiV3Sdk.ApiClient.instance;
            const apiKey = defaultClient.authentications['api-key'];
            apiKey.apiKey = process.env.BREVO_API_KEY;

            const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = `<html><body><p>${text.replace(/\n/g, "<br>")}</p></body></html>`;
            sendSmtpEmail.sender = { "name": "Opinions App", "email": process.env.EMAIL_USER || "no-reply@opinions.com" };
            sendSmtpEmail.to = [{ "email": to }];

            await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log(`📧 Email sent to ${to} via Brevo`);
            return true;
        } catch (error) {
            console.error('Brevo API failed:', error);
            return false;
        }
    }

    // 2. Fallback: Log to console ONLY if no key is configured (Local Dev)
    if (!process.env.BREVO_API_KEY) {
        console.log('---------------------------------------------------');
        console.log(`⚠️  EMAIL FALLBACK (No API Key)`);
        console.log(`📨 To: ${to}`);
        console.log(`TEXT BODY: ${text}`);
        console.log('---------------------------------------------------');
        return true;
    }
};

module.exports = sendEmail;
