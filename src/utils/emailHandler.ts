import nodemailer from 'nodemailer';
import { loadEmailTemplate, getEmailContent } from './emailTemplateLoader';

export const sendEmail = async (recipient: string, category: string): Promise<void> => {
    const { subject, message, color } = getEmailContent(category);

    const htmlContent = loadEmailTemplate(subject, message, color);

    const transporter = nodemailer.createTransport({
        service: process.env['EMAIL_SERVICE'],
        auth: {
            user: process.env['EMAIL_USER'],
            pass: process.env['EMAIL_PASS'],
        },
    });

    await transporter.sendMail({
        from: process.env['EMAIL_USER'],
        to: recipient,
        subject,
        html: htmlContent,
    });

    console.log(`Email sent to ${recipient} for category: ${category}`);
};
