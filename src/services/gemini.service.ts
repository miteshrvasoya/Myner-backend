import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const parseWithGemini = async (message: string): Promise<any | null> => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
      You're a product message parser. Extract the following fields from this message and return a JSON object in this format:

      {
        "product_name": "",
        "price": 0,
        "quantity": 1
      }

      If you cannot extract product_name or price, return an empty JSON like: {}

      Message:
      """${message}"""
      `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    if (text.startsWith("```json")) {
      text = text.replace(/```json\s*/, "").replace(/```$/, "").trim();
    } else if (text.startsWith("```")) {
      text = text.replace(/```\s*/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(text);
    if (!parsed.product_name || !parsed.price) return null;

    return {
      product_name: parsed.product_name.trim(),
      price: parseInt(parsed.price),
      quantity: parsed.quantity ? parseInt(parsed.quantity) : 1,
    };
  } catch (err) {
    console.error("❌ Gemini parse error:", err);
    return null;
  }
};

