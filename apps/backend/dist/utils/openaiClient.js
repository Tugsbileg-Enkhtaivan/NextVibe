"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenAIClient = void 0;
const openai_1 = require("openai");
let openaiInstance = null;
const getOpenAIClient = () => {
    if (!openaiInstance) {
        openaiInstance = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 30000,
        });
    }
    return openaiInstance;
};
exports.getOpenAIClient = getOpenAIClient;
//# sourceMappingURL=openaiClient.js.map