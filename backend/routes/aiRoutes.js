const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const AIRequestSchema = z.object({
  action: z.enum(['summarize', 'quiz', 'pyq', 'qa']),
  content: z.string().min(10).max(10000), // Safety guard on token size
  query: z.string().optional()
});

router.post('/generate', verifyToken, async (req, res) => {
  try {
    const validated = AIRequestSchema.parse(req.body);
    const { action, content, query } = validated;

    let prompt = "";
    switch (action) {
      case 'summarize':
        prompt = `You are a helpful study assistant. Summarize the following educational content in a structured, concise way using bullet points. Focus on key concepts and definitions.\n\nContent:\n${content}`;
        break;
      case 'quiz':
        prompt = `Based on the following content, generate 5 multiple-choice questions for a quiz. Provide the questions, options, and clearly mark the correct answer for each.\n\nContent:\n${content}`;
        break;
      case 'pyq':
        prompt = `Act as an experienced university examiner. Based on the following content, generate 3 high-probability 'Previous Year Style' exam questions. Include one short answer (2 marks), one medium (5 marks), and one long answer (10 marks) question.\n\nContent:\n${content}`;
        break;
      case 'qa':
        prompt = `The user has a question about the following content. Answer their question accurately based ONLY on the text provided. If the answer is not in the text, say you don't know.\n\nQuestion: ${query}\n\nContent:\n${content}`;
        break;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ result: text });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('[AI ERROR]', error);
    res.status(500).json({ error: 'Failed to process AI request. Please try again.' });
  }
});

module.exports = router;
