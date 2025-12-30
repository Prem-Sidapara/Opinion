const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
    // If credentials are provided, send real email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to,
                subject,
                text,
            });
            console.log(`📧 Email sent to ${to}`);
            return true;
        } catch (error) {
            console.error('Email send failed:', error);
            return false;
        }
    } else {
        // Fallback: Log to console for development
        console.log('---------------------------------------------------');
        console.log(`⚠️  EMAIL SERVICE NOT CONFIGURED (Check .env)`);
        console.log(`📨 To: ${to}`);
        console.log(`📝 Subject: ${subject}`);
        console.log(`TEXT BODY:`);
        console.log(text);
        console.log('---------------------------------------------------');
        return true;
    }
};

module.exports = sendEmail;
