const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');

// We use the same generic error handling or middleware if needed.
// If the app has an authMiddleware like verifyToken, we should consider if we need it. 
// For now we'll rely on the existing rate limiters we will attach in index.js.

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest",
  systemInstruction: `You are AFIN's AI Chat Assistant. You act like a smart, helpful college friend. 
Your tone should be friendly, casual, slightly slangy (e.g., using "bro", "ngl", "cooked" occasionally when appropriate), but still respectful, supportive, and useful. 
Do NOT sound robotic or overly formal. Keep answers concise unless a detailed answer is explicitly needed.

Focus areas: academics, study guidance, notes help, project ideas, coding help, placements, motivation, and college-related questions.
You have context about the AFIN platform (A Friend In Need - a student-powered academic content portal where students can find PYQs, notes, assignments, and study materials). If a user asks about PYQs or notes, relate it to checking the AFIN platform.

CRITICAL RULES:
1. Avoid cringe or excessive slang.
2. Avoid offensive language.
3. Avoid unprofessional tone when dealing with serious subjects (like mental health).
4. If you don't know the answer, just admit it like a friend would ("Honestly bro, I'm not entirely sure about that one...").
5. Format your output using markdown for readability (code blocks, bold text, bullet points).`
});

const ChatRequestSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({
      text: z.string()
    }))
  })).optional().default([]),
  message: z.string().min(1).max(2000)
});

router.post('/message', async (req, res) => {
  try {
    const validated = ChatRequestSchema.parse(req.body);
    const { history, message } = validated;

    let responseText = "";
    try {
      // Start a chat session with the provided history
      const chatSession = model.startChat({ history });
      const result = await chatSession.sendMessage(message);
      responseText = result.response.text();
    } catch (apiError) {
      // Retry once on 503 or 429 after 1 second delay
      if (apiError.status === 503 || apiError.status === 429 || String(apiError).includes('503') || String(apiError).includes('429')) {
        console.warn('API busy, retrying in 1s...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const chatSession = model.startChat({ history });
        const result = await chatSession.sendMessage(message);
        responseText = result.response.text();
      } else {
        throw apiError;
      }
    }

    res.json({ response: responseText });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('[CHATBOT ERROR]', error);
    try { require('fs').writeFileSync('error_log.txt', String(error.stack || error.message)); } catch(e){}
    
    // Provide a friendly fallback message
    res.status(500).json({ 
      error: 'Bro the AI server is having a moment 😭 try again in a bit',
      details: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
