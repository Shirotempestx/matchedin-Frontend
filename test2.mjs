import { GoogleGenerativeAI } from '@google/generative-ai';
const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) {
    throw new Error('Missing VITE_GEMINI_API_KEY or GEMINI_API_KEY for model tests.');
}
const genAI = new GoogleGenerativeAI(API_KEY);
const models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemma-3-4b-it', 'gemini-3.1-flash-lite-preview', 'gemini-flash-latest'];

async function test() {
    for(let m of models) {
        try {
            console.log('Testing: ' + m);
            await genAI.getGenerativeModel({model:m}).generateContent('Hi');
            console.log('SUCCESS: ' + m);
            process.exit(0);
        } catch(e) {
            console.log('FAIL: ' + m + ' - ' + e.message.split('\n')[0]);
        }
    }
}
test();
