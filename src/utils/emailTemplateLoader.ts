import fs from 'fs';
import path from 'path';

const contentsTemplatesPath = path.resolve(__dirname, '../templates/emailTemplates.json');

export const loadEmailTemplate = (subject: string, message: string, color: string): string => {
    const templatePath = path.resolve(__dirname, '../templates/emailTemplate.html');
    let template = fs.readFileSync(templatePath, 'utf8');
    return template.replace('{{subject}}', subject).replace('{{message}}', message).replace('{{color}}', color);
};

export const getEmailContent = (category: string) => {
    const templates = JSON.parse(fs.readFileSync(contentsTemplatesPath, 'utf8'));
    return templates[category] || templates['others'];
};
