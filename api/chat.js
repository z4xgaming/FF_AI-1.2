export default async function handler(req, res) {
    // CORS Headers set kar rahe hain taaki koi block na aaye
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Aapki di hui AQ. wali key jo Screenshot_2026-07-06-00-38-02-337_com.android.chrome.jpg mein bhi hai
        const AUTH_TOKEN = 'AQ.Ab8RN6KV8cOpGvjR0NVuI8ek2ZmFI0HwCE4He5XZgytfWZqUNQ';

        // 🎯 OAuth/Access Token ke liye URL bina '?key=' ke call hota hai
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

        const payload = {
            contents: [{
                parts: [{ text: message }]
            }]
        };

        // Bearer Header ke saath request bhej rahe hain taaki 401 Unauthorized na aaye
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `Google API Error: ${response.status}`);
        }

        const replyText = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ reply: replyText });

    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(500).json({ error: error.message });
    }
                                     }
                                     
