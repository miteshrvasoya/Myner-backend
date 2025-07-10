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
            `;

    const res = await axios.post('http://localhost:11434/api/generate', {
        model: 'phi3',
        prompt,
        stream: false
    });

    const responseText = res.data.response.trim();

    try {
        const jsonStart = responseText.indexOf('{');
        const json = JSON.parse(responseText.slice(jsonStart));
        return json;
    } catch (err) {
        console.error("❌ LLM returned invalid JSON:", responseText);
        return null;
    }
};
