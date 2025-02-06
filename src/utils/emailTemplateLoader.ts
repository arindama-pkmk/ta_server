import fs from 'fs';
import path from 'path';

const contentsTemplatesPath = path.resolve(__dirname, '../templates/emailTemplates.json');

/**
 * Loads an email template from the 'emailTemplate.html' file and replaces the
 * placeholders with the provided subject, message, and color.
 *
 * @param {string} subject - The subject line of the email.
 * @param {string} message - The message to be displayed in the email.
 * @param {string} color - The color to be used for displaying the message.
 *
 * @returns {string} The rendered HTML email template with the placeholders replaced.
 */
export const loadEmailTemplate = (subject: string, message: string, color: string): string => {
    const templatePath = path.resolve(__dirname, '../templates/emailTemplate.html');
    let template = fs.readFileSync(templatePath, 'utf8');
    return template.replace('{{subject}}', subject).replace('{{message}}', message).replace('{{color}}', color);
};

/**
 * Retrieves the email content associated with the given category from the
 * emailTemplates.json file. If the category is not found, the 'others' category
 * is used as a fallback.
 *
 * @param {string} category - The category of the email for which to get the
 * content.
 *
 * @returns {string} An object containing the subject line, message, and color
 * for the email associated with the given category.
 */
export const getEmailContent = (category: string) => {
    const templates = JSON.parse(fs.readFileSync(contentsTemplatesPath, 'utf8'));
    return templates[category] || templates['others'];
};
