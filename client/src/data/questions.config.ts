export type QuestionFieldType = 'text' | 'select' | 'number';

export interface QuestionField {
    id: string;
    type: QuestionFieldType;
    label: string;
    options?: string[]; // For 'select' type
    placeholder?: string;
}

export interface StageConfig {
    id: string;
    title: string;
    icon: string; // Lucide icon name
    fields: QuestionField[];
}

export const STAGE_1_QUESTIONS: StageConfig = {
    id: 'product_classification',
    title: 'Product Classification', // Or "Basics" as per user request, but title matches stage name usually
    icon: 'Package',
    fields: [
        {
            id: 'product_type',
            type: 'select',
            label: 'What are you pricing?',
            options: ['Physical Product', 'Service', 'Digital Product'],
        },
        {
            id: 'product_name',
            type: 'text',
            label: 'Product Name',
            placeholder: 'e.g. Premium Coffee Blend',
        },
        {
            id: 'currency',
            type: 'select',
            label: 'Currency',
            options: ['USD', 'EUR', 'GBP', 'INR'],
        },
    ],
};
