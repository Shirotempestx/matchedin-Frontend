import { GoogleGenerativeAI } from '@google/generative-ai';
const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) {
    throw new Error('Missing VITE_GEMINI_API_KEY or GEMINI_API_KEY for model tests.');
}
const genAI = new GoogleGenerativeAI(API_KEY);
const modelsToTest = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.0-pro', 'gemini-pro'];

async function testModels() {
    for (const modelName of modelsToTest) {
        console.log('Testing model: ' + modelName);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hi');
            if (result.response) {
                console.log('SUCCESS: ' + modelName);
                process.exit(0);
            }
        } catch (err) {
            console.log('FAILED: ' + modelName + ' - ' + err.message);
        }
    }
    process.exit(1);
}
testModels();
