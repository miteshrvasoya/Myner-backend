import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const parseWithGemini = async (message: string): Promise<any> => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
              You're a product message parser. Extract fields from the message in this JSON format:

              {
                "product_name": "",
                "price": 0,
                "quantity": 1
              }

              Message:
              """${message}"""
              `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text().trim();

  console.log("📥 Gemini response (raw):", text);

  // 🔧 Clean markdown code block if it exists
  if (text.startsWith("```json")) {
    text = text.replace(/```json\s*/, "").replace(/```$/, "").trim();
  } else if (text.startsWith("```")) {
    text = text.replace(/```\s*/, "").replace(/```$/, "").trim();
  }

  console.log("📂 Cleaned Gemini output:", text);

  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error("❌ Failed to parse cleaned Gemini output:", text);
    console.error("📥 Error while parsing data:", err);
    return null;
  }
};
