
import { GoogleGenAI, Type } from "@google/genai";
import { CustomerRecord } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const analyzeRecords = async (records: CustomerRecord[]) => {
  const model = 'gemini-3-flash-preview';
  const prompt = `Dựa trên danh sách hồ sơ dịch vụ công sau đây: ${JSON.stringify(records)}. 
  Hãy phân tích và đưa ra 3 nhận xét ngắn gọn về:
  1. Hiệu suất xử lý (bao nhiêu hồ sơ hoàn thành).
  2. Các loại dịch vụ phổ biến nhất.
  3. Lời khuyên để cải thiện quy trình làm việc.
  Viết bằng tiếng Việt, súc tích.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    // The response.text property directly returns the string output.
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Không thể phân tích dữ liệu lúc này.";
  }
};

export const getDocumentSuggestions = async (serviceName: string) => {
  const model = 'gemini-3-flash-preview';
  const prompt = `Khách hàng muốn thực hiện dịch vụ công: "${serviceName}". 
  Hãy liệt kê danh sách các giấy tờ cần cung cấp thông thường cho dịch vụ này tại Việt Nam. 
  Trả về định dạng JSON gồm mảng string các loại giấy tờ.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documents: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["documents"]
        }
      }
    });
    // Using response.text to extract the JSON string and parsing it.
    return JSON.parse(response.text || "{\"documents\": []}").documents;
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};
