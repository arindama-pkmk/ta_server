import nodemailer from 'nodemailer';
import { loadEmailTemplate, getEmailContent } from './emailTemplateLoader';

/**
 * Sends an email to the specified recipient with the email content defined in the emailContentsTemplate.json file
 * under the specified category.
 *
 * @param {string} recipient - The recipient of the email.
 * @param {string} category - The category of the email content to send.
 *
 * @returns {Promise<void>} A promise that resolves when the email has been sent.
 */
export const sendEmail = async (recipient: string, category: string) => {
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
