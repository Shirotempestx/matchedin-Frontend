import { GoogleGenerativeAI, type ChatSession } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

if (!API_KEY) {
    console.warn('VITE_GEMINI_API_KEY is not configured. Chatbot AI calls will fail until configured.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export function createChatSession(systemPrompt: string): ChatSession {
    if (!API_KEY) {
        throw new Error('Gemini API key is missing. Configure VITE_GEMINI_API_KEY in FrontEnd environment.');
    }

    const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
        history: [],
        generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
        },
    });

    return chat;
}

export async function sendMessage(chat: ChatSession, message: string): Promise<string> {
    try {
        const result = await chat.sendMessage(message);
        const response = result.response;
        return response.text();
    } catch (error: any) {
        console.error('Gemini API error:', error);
        throw new Error(error?.message || 'Erreur de communication avec l\'assistant IA.');
    }
}
