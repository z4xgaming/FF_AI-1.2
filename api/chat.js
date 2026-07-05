import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing message' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY missing');
    return res.status(500).json({ error: 'Server misconfigured: API key missing' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash – most stable
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
    });

    const reply = result.response.text();
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Gemini error:', error);
    // Provide a user-friendly message
    let errorMsg = 'Gemini API error. Please check your key and quota.';
    if (error.message?.includes('quota')) {
      errorMsg = '⚠️ Quota exhausted. Please enable billing or use a new key.';
    } else if (error.message?.includes('API key')) {
      errorMsg = '❌ Invalid API key. Please regenerate from Google AI Studio.';
    } else if (error.message?.includes('not found')) {
      errorMsg = '❌ Model not found. Trying fallback...';
      // Optional fallback to gemini-pro (deprecated but might work)
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const fallbackResult = await fallbackModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: message }] }],
        });
        return res.status(200).json({ reply: fallbackResult.response.text() });
      } catch (fbErr) {
        errorMsg = '❌ All models failed. Please check your API key and quota.';
      }
    }
    return res.status(500).json({ error: errorMsg });
  }
               }
