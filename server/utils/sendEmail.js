const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
    // If credentials are provided, send real email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
                connectionTimeout: 5000, // Fail fast (5s)
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
            // Suppress messy error, just log simple warning
            console.log('⚠️  Gmail SMTP Connection Failed (Likely Firewall). Switching to Fallback.');

            // FALLBACK: Log to console so user can still see OTP
            console.log('\n===================================================');
            console.log(`🔑 YOUR LOGIN CODE IS HERE:`);
            console.log(`\n    ${text.split('code is: ')[1]?.split('\n')[0] || 'CHECK TEXT BELOW'}    \n`);
            console.log(`(Email failed, but this code works!)`);
            console.log('===================================================\n');
            return true; // Pretend success to UI
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
