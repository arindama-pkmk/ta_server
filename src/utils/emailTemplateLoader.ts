import fs from 'fs';
import path from 'path';

const contentsTemplatesPath = path.resolve(__dirname, '../templates/emailContentsTemplate.json'); // Correct filename

export const loadEmailTemplate = (subject: string, messageTemplate: string, color: string, templateVars?: Record<string, string>): string => {
    const templatePath = path.resolve(__dirname, '../templates/emailTemplate.html');
    let template = fs.readFileSync(templatePath, 'utf8');
    let processedMessage = messageTemplate;
    if (templateVars) {
        for (const key in templateVars) {
            // Ensure placeholder like {{key}} is replaced
            processedMessage = processedMessage.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), templateVars?.[key] ?? '');
        }
    }
    return template.replace('{{subject}}', subject).replace('{{message}}', processedMessage).replace('{{color}}', color);
};
export const getEmailContent = (category: string) => { // Correct filename for reading
    const templates = JSON.parse(fs.readFileSync(contentsTemplatesPath, 'utf8'));
    return templates[category] || templates['others'];
};