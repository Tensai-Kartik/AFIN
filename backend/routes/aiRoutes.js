const express = require('express');
const router = express.Router();
const { verifyToken, requireVerifiedStudent } = require('../middleware/authMiddleware');
const { z } = require('zod');
const { getAiModel, withKeyRotation } = require('../utils/geminiHelper');

const AIRequestSchema = z.object({
  action: z.enum(['summarize', 'quiz', 'pyq', 'qa']),
  content: z.string().min(10, "Content too short").max(10000, "Content too long"),
  metadata: z.object({
    subject: z.string().optional(),
    semester: z.number().optional()
  }).optional()
});

/**
 * POST /api/ai/generate
 * Generate study material from content
 */
router.post('/generate', verifyToken, requireVerifiedStudent, async (req, res) => {
  try {
    const validated = AIRequestSchema.parse(req.body);
    const { action, content, metadata } = validated;

    let prompt = "";
    const subjectContext = metadata?.subject ? ` for the subject ${metadata.subject}` : '';

    switch (action) {
      case 'summarize':
        prompt = `You are an expert academic tutor. Summarize the following study material${subjectContext} clearly and concisely. Highlight key concepts, formulas, and definitions. Format the output nicely using Markdown.\n\nContent:\n${content}`;
        break;
      case 'quiz':
        prompt = `You are a strict examiner. Generate a 5-question multiple choice quiz based on the following material${subjectContext}. Provide the questions first, and then the answer key at the very end. Format using Markdown.\n\nContent:\n${content}`;
        break;
      case 'pyq':
        prompt = `Based on the following syllabus/content${subjectContext}, predict 3 likely long-form questions that might appear in an end-semester university exam. Provide a brief hint on how to answer each. Format using Markdown.\n\nContent:\n${content}`;
        break;
      case 'qa':
        prompt = `Read the following content${subjectContext} carefully. Then extract 5 important short Q&A pairs (Question and Answer) that a student must memorize. Format using Markdown.\n\nContent:\n${content}`;
        break;
    }

    const responseText = await withKeyRotation(async () => {
      const model = getAiModel();
      const result = await model.generateContent(prompt);
      return result.response.text();
    });

    res.json({ result: responseText });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('[AI GEN ERROR]', error);
    res.status(500).json({ error: 'Failed to generate AI content.' });
  }
});

module.exports = router;
