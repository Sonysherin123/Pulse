const nodemailer = require("nodemailer");
const config = require("../config/config");


// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {
        user: "pulsewatchesonline@gmail.com",
        pass: "vcah jvvq zgfn kqzd"
    },
    
    tls: {
        rejectUnauthorized: false // Accept self-signed certificates
    }
    // tls: {
    //     // Enable TLS with minimum version set to TLSv1.2
    //     minVersion: 'TLSv1.2'
    // }
});

// Send OTP email for forget password
const sendInsertOtp = async (email, otp) => {
    console.log(email,otp,"in send otp");
    // console.log(config.emailUser,config.emailPassword)
    const mailOptions = {
        from: '"PULSE" <pulsewatchesonline@gmail.com>',
        to: email,
        subject: 'Your one time password, PULSE',
        text: `Hi, Your OTP is ${otp}`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully: ", info.response);
        console.log(otp);
        return otp;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP');
    }
};

module.exports = { sendInsertOtp };
