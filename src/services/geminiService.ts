import { GoogleGenerativeAI } from "@google/generative-ai";
import { CustomerRecord } from "../types";

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Hàm 1: Phân tích danh sách hồ sơ (Dùng cho Dashboard)
export const analyzeRecords = async (records: CustomerRecord[]) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Dựa trên danh sách hồ sơ: ${JSON.stringify(records)}, hãy đưa ra 3 nhận xét ngắn bằng tiếng Việt.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Không thể phân tích dữ liệu.";
  }
};

// Hàm 2: Gợi ý giấy tờ (Giải quyết lỗi 'getDocumentSuggestions' trong ảnh của bạn)
export const getDocumentSuggestions = async (serviceType: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Dịch vụ công: ${serviceType}. Hãy liệt kê 3 loại giấy tờ cần thiết nhất (ngắn gọn, tiếng Việt).`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return "Vui lòng chuẩn bị giấy tờ theo quy định.";
  }
};