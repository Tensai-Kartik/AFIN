const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

// The array of keys starting with the one in environment variables, followed by the fallback keys
const envKeys = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS || '';
const API_KEYS = envKeys.split(',').map(key => key.trim()).filter(Boolean); // Remove any undefined or empty strings

let currentKeyIndex = 0;

// The search database tool declaration for the chatbot
const searchTool = {
  functionDeclarations: [
    {
      name: "search_database",
      description: "Search the AFIN platform database for academic content (uploads, notes, pyqs, assignments, research papers) and official notices. Call this when the user asks about specific uploads, research papers, notes, or recent notices.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description: "The search query (e.g., 'dnyanu gaware', 'web dev', 'midterm pyq')."
          },
          table: {
            type: SchemaType.STRING,
            description: "The table to search in: 'content' (for uploads, notes, research papers, etc.) or 'notices'.",
            enum: ["content", "notices"]
          }
        },
        required: ["query", "table"]
      }
    }
  ]
};

// Common configuration
const TARGET_MODEL = "gemini-2.5-flash";

function getChatbotModel() {
  const currentKey = API_KEYS[currentKeyIndex];
  const genAI = new GoogleGenerativeAI(currentKey);
  
  return genAI.getGenerativeModel({ 
    model: TARGET_MODEL,
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
5. Format your output using markdown for readability (code blocks, bold text, bullet points).
6. When answering questions about database content, always use the search_database tool to fetch the latest information. Mention the uploader/author's name and provide the file_url or link if available.`,
    tools: [searchTool]
  });
}

function getAiModel() {
  const currentKey = API_KEYS[currentKeyIndex];
  const genAI = new GoogleGenerativeAI(currentKey);
  
  return genAI.getGenerativeModel({ model: TARGET_MODEL });
}

// A robust wrapper that executes a Gemini API call and rotates keys if it hits a quota/server error
async function withKeyRotation(apiCallFunction) {
  let attempts = 0;
  const maxAttempts = API_KEYS.length;

  while (attempts < maxAttempts) {
    try {
      // Execute the provided function
      return await apiCallFunction();
    } catch (apiError) {
      const errorMsg = String(apiError);
      
      // Check if the error is related to quota (429), server overloaded (503), or network timeout
      if (
        apiError.status === 429 || 
        apiError.status === 503 || 
        errorMsg.includes('429') || 
        errorMsg.includes('503') || 
        errorMsg.includes('fetch failed')
      ) {
        console.warn(`[GEMINI ROTATION] Key at index ${currentKeyIndex} failed (Status: ${apiError.status || 'Network'}). Rotating to next key...`);
        
        // Move to the next key
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        attempts++;
        
        // Brief pause before retry
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (attempts >= maxAttempts) {
          console.error('[GEMINI ROTATION] Exhausted all available API keys.');
          throw new Error('All API keys exhausted their quotas or are currently unavailable.');
        }
      } else {
        // If it's a different error (e.g., bad request, invalid prompt), throw it immediately without rotating
        throw apiError;
      }
    }
  }
}

module.exports = {
  getChatbotModel,
  getAiModel,
  withKeyRotation
};
