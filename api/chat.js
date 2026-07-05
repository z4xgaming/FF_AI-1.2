import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "message"' });
  }

  // Read API key from environment variable
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not set in environment');
    return res.status(500).json({ error: 'Server misconfiguration: API key missing' });
  }

  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the most stable model: gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
    });

    const reply = result.response.text();
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Gemini API error:', error);

    // Try fallback to gemini-pro (just in case)
    if (error.message?.includes('not found') || error.status === 404) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await fallbackModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: message }] }],
        });
        const reply = result.response.text();
        return res.status(200).json({ reply });
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError);
        return res.status(500).json({ error: 'All models failed. Please check your API key and quota.' });
      }
    }

    // Other errors: quota, invalid key, etc.
    let userMsg = 'Gemini API error. ';
    if (error.message?.includes('quota')) {
      userMsg = '⚠️ Quota exhausted. Please enable billing or use a new key.';
    } else if (error.message?.includes('API key')) {
      userMsg = '❌ Invalid API key. Generate a new one from Google AI Studio.';
    } else {
      userMsg = `❌ ${error.message || 'Unknown error'}`;
    }
    return res.status(500).json({ error: userMsg });
  }
}
