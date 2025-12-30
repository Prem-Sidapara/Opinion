const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
    // If credentials are provided, send real email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // use false for STARTTLS; true for 465
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
            // FALLBACK: Log to console so user can still see OTP
            console.log('---------------------------------------------------');
            console.log(`⚠️  EMAIL FAILED - FALLBACK LOGGING`);
            console.log(`📨 To: ${to}`);
            console.log(`📝 Subject: ${subject}`);
            console.log(`TEXT BODY:`);
            console.log(text);
            console.log('---------------------------------------------------');
            return true; // Pretend success
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
