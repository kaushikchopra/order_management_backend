import nodemailer from "nodemailer";
import { clientURL } from "../config/config.js";
import "dotenv/config";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        ciphers: "SSLv3"
    }
})

function createEmailTemplate(subject, message, buttonLink, buttonText) {
    return `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f7f7f7;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #fff;
                        border-radius: 5px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                        color: #007bff;
                    }
                    p {
                        font-size: 16px;
                        line-height: 1.6;
                    }
                    a.button {
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: #007bff;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>${subject}</h1>
                    ${message}
                    <a href="${buttonLink}" class="button">${buttonText}</a>
                </div>
            </body>
        </html>
    `;
}

export async function sendActivationEmail(email, activationToken) {
    const subject = "User Account Activation Request";
    const message = `
        <p>This email is to verify your email account.</p>
        <p>Please click on the following button to activate your account:</p>
    `;
    const buttonText = "Activate Account";

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html: createEmailTemplate(subject, message, `${clientURL}/activation/${activationToken}`, buttonText)
    };

    return sendEmail(mailOptions);
}

export async function sendResetPasswordEmail(email, resetPasswordToken) {
    const subject = "Password Reset Request";
    const message = `
        <p>Hello there,</p>
        <p>We have received a request to reset the password for your account.</p>
        <p>If this was not you, please disregard this email. Your password will remain unchanged.</p>
        <p>To reset your password, please click the button below:</p>
    `;
    const buttonText = "Reset Password";

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html: createEmailTemplate(subject, message, `${clientURL}/reset-password/${resetPasswordToken}`, buttonText)
    };

    return sendEmail(mailOptions);
}

async function sendEmail(mailOptions) {
    try {
        const mailSentResponse = await transporter.sendMail(mailOptions);
        // console.log(mailSentResponse.response); // log response
        return mailSentResponse;
    } catch (error) {
        // console.error(error); // log error
        return error;
    }
}
