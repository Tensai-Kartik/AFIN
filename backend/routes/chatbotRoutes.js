const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { getChatbotModel, withKeyRotation } = require('../utils/geminiHelper');

const ChatRequestSchema = z.object({
  history: z.array(z.any()).optional().default([]),
  message: z.string().min(1).max(2000)
});

router.post('/message', async (req, res) => {
  try {
    const validated = ChatRequestSchema.parse(req.body);
    const { history, message } = validated;

    // Use the centralized key rotation logic
    const responseText = await withKeyRotation(async () => {
      // getChatbotModel() is called fresh on each retry, so it always grabs the latest key
      const model = getChatbotModel();
      const chatSession = model.startChat({ history });
      let result = await chatSession.sendMessage(message);

      while (result.response.functionCalls && result.response.functionCalls() && result.response.functionCalls().length > 0) {
        const call = result.response.functionCalls()[0];
        
        if (call.name === "search_database") {
          const { query, table } = call.args;
          let dbResults = [];
          
          if (table === 'content') {
            try {
              const [res1, res2] = await Promise.all([
                req.supabase
                  .from('content')
                  .select('title, description, subject, semester, type, file_url, users(full_name)')
                  .or(`title.ilike.%${query}%,description.ilike.%${query}%,subject.ilike.%${query}%`)
                  .limit(5),
                req.supabase
                  .from('content')
                  .select('title, description, subject, semester, type, file_url, users!inner(full_name)')
                  .ilike('users.full_name', `%${query}%`)
                  .limit(5)
              ]);
              if (res1.error) console.error('Supabase content query error:', res1.error);
              if (res2.error) console.error('Supabase content user query error:', res2.error);
              dbResults = [...(res1.data || []), ...(res2.data || [])].slice(0, 8);
            } catch (e) { console.error('Supabase fetch error:', e); }
          } else if (table === 'notices') {
            try {
              const [res1, res2] = await Promise.all([
                req.supabase
                  .from('notices')
                  .select('title, description, category, is_important, users(full_name)')
                  .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
                  .limit(5),
                req.supabase
                  .from('notices')
                  .select('title, description, category, is_important, users!inner(full_name)')
                  .ilike('users.full_name', `%${query}%`)
                  .limit(5)
              ]);
              if (res1.error) console.error('Supabase notices query error:', res1.error);
              if (res2.error) console.error('Supabase notices user query error:', res2.error);
              dbResults = [...(res1.data || []), ...(res2.data || [])].slice(0, 8);
            } catch (e) { console.error('Supabase fetch error:', e); }
          }
          
          result = await chatSession.sendMessage([{
            functionResponse: {
              name: "search_database",
              response: { results: dbResults }
            }
          }]);
        } else {
          break; // Unknown tool
        }
      }
      return result.response.text();
    });

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
