import { GoogleGenerativeAI, type ChatSession } from '@google/generative-ai';
import api from './axios';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND_CHAT_API === 'true';

if (!API_KEY && !USE_BACKEND) {
    console.warn('VITE_GEMINI_API_KEY is not configured and VITE_USE_BACKEND_CHAT_API is false. Chatbot AI calls will fail.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export function createChatSession(systemPrompt: string): ChatSession | any {
    if (USE_BACKEND) {
        // When using backend, we don't need a local session object from the SDK
        // We just return a stateful object that sendMessage can use
        return { systemPrompt, isBackend: true };
    }

    if (!API_KEY || !genAI) {
        throw new Error('Gemini API key is missing. Configure VITE_GEMINI_API_KEY in FrontEnd environment or enable VITE_USE_BACKEND_CHAT_API.');
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

export async function sendMessage(chat: ChatSession | any, message: string): Promise<string> {
    try {
        if (chat?.isBackend) {
            const res = await api.post('/chatbot', {
                message,
                system_prompt: chat.systemPrompt
            });
            return res.data.response;
        }

        const result = await (chat as ChatSession).sendMessage(message);
        const response = result.response;
        return response.text();
    } catch (error: any) {
        console.error('Gemini API error:', error);
        const message_error = error?.response?.data?.message || (error?.message || 'Erreur de communication avec l\'assistant IA.');
        throw new Error(message_error);
    }
}
