import nodemailer from 'nodemailer';
import UserModel from '@/models/User';
import bcryptjs from 'bcryptjs';

export const sendEmail = async ({email, emailType, userId}: any) => {
    try{
        const hashedToken = await bcryptjs.hash(userId.toString(), 10);

        const encodedToken = encodeURIComponent(hashedToken);

        if(emailType === "VERIFY"){
            await UserModel.findByIdAndUpdate(
                userId, {
                    $set: {
                        verifyToken: hashedToken,
                        verifyTokenExpiry: new Date(Date.now() + 3600000)
                    }
                }
            );
        } else if(emailType === "RESET"){
            await UserModel.findByIdAndUpdate(
                userId, {
                    $set: {
                        forgotPasswordToken: hashedToken,
                        forgotPasswordTokenExpiry: new Date(Date.now() + 3600000)
                    }
                }
            );
        }

        // From mailtrap. The user & pass should be kept in the .env
        var transport = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "3350ee1099fc8b",
                pass: "0b5aa2c6efa6c1"
            }
        });


        const htmlVerify = `<p>Hi,</p>
                    <p>Thank you for registering. Please verify your email by clicking the link below:</p>
                    <a href="${process.env.DOMAIN}/verifyemail?token=${encodedToken}">Verify Email</a></br>
                    <p>Or copy the below link in a new tab in your browser:</br>${process.env.DOMAIN}/verifyemail?token=${encodedToken}</p>
                    <p>If you did not request this, please ignore this email.</p>`;
        const htmlReset = `<p>Hi,</p>
                    <p>We received a request to reset your password. Click the link below to reset it:</p>
                    <a href="${process.env.DOMAIN}/resetpassword?token=${encodedToken}">Reset Password</a></br>
                    <p>Or copy the below link in a new tab in your browser:</br>${process.env.DOMAIN}/verifyemail?token=${encodedToken}</p>
                    <p>If you did not request this, please ignore this email.</p>`;
        
        const mailOptions = {
            from: 'bhavesh@bhavesh.com',
            to: email,
            subject: emailType === 'VERIFY' ? "Verify your email" : "Reset your password",
            html: emailType === 'VERIFY' ? htmlVerify : htmlReset,
        }

        const mailResponse = await transport.sendMail(mailOptions);

        return mailResponse;
    } catch (error:any) {
        throw new Error(error.message)
    }
}

