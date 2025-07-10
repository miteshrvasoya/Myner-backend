import axios from 'axios';

export const parseWithLocalLLM = async (message: string): Promise<any> => {
    console.log("🔍 Parsing message with local LLM:", message);

    const prompt = `
        You are a product parser. Extract the following JSON fields from the message:

        {
        "product_name": "",
        "price": 0,
        "quantity": 1
        }

        Message:
        """${message}"""

        Return only JSON.
        `;

    const res = await axios.post('http://localhost:11434/api/generate', {
        model: 'phi3',
        prompt,
        stream: false
    });

    let responseText = res.data.response.trim();
    console.log("📥 Raw response:", responseText);

    // 🔧 Clean up triple-backtick formatting
    if (responseText.startsWith("```json")) {
        responseText = responseText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    } else if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```\s*/, "").replace(/```$/, "").trim();
    }

    try {
        const jsonStart = responseText.indexOf('{');
        const jsonText = responseText.slice(jsonStart);
        const parsed = JSON.parse(jsonText);

        // ✅ Optional: Basic sanity fix
        parsed.price = typeof parsed.price === 'number' && parsed.price >= 0 ? parsed.price : 0;
        parsed.quantity = typeof parsed.quantity === 'number' && parsed.quantity > 0 ? parsed.quantity : 1;

        console.log("✅ Parsed JSON:", parsed);
        return parsed;
    } catch (err) {
        console.error("❌ Failed to parse JSON:", responseText);
        return null;
    }
};