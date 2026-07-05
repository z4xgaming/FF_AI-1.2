import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "message" field' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not set');
    res.status(500).json({ error: 'Server misconfiguration: API key missing' });
    return;
  }

  try {
    // Initialize Gemini with the API key
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use gemini-2.0-flash-exp (latest experimental)
    // If you get a 404, try 'gemini-1.5-flash' as fallback
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Generate response
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
    });

    const response = result.response;
    const reply = response.text();

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Gemini API error:', error);

    // If model not found, try fallback
    if (error.message?.includes('not found') || error.status === 404) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await fallbackModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: message }] }],
        });
        const reply = result.response.text();
        res.status(200).json({ reply });
        return;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        res.status(500).json({ error: 'All models failed. Please check your API key and quota.' });
        return;
      }
    }

    // Other errors
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
      }
