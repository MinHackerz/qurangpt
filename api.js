const API_KEY = 'AIzaSyBq6CK24S5pm6mPdc_dfdbbPBpiSb_kvYo'; // Replace 'YOUR_API_KEY_HERE' with your actual API key

async function generate_response_with_gemini(prompt) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    const headers = {
        'Content-Type': 'application/json'
    };

    const body = {
        'contents': [
            {
                'parts': [
                    { 'text': prompt }
                ]
            }
        ]
    };

    const options = {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    };

    try {
      const response = await fetch(apiUrl, options);
      const data = await response.json();
      if (response.ok) {
        const extractedText = data.candidates[0].content.parts[0].text;
        return extractedText;
    } else {
        throw new Error('Error generating response from Gemini API');
    }
} catch (error) {
    console.error('Error:', error);
    throw error;
}
