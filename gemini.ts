import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Chuyển đổi File sang Base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Đóng dấu bản quyền La Perla lên ảnh kết quả
 */
const addWatermark = (base64Image: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = `data:image/png;base64,${base64Image}`;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Image);
      
      ctx.drawImage(img, 0, 0);
      
      const watermarkText = 'La Perla Nails & Beauty';
      const fontSize = Math.max(20, Math.round(canvas.width / 20));
      ctx.font = `600 ${fontSize}px "Playfair Display", serif`;
      
      // Shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      
      ctx.fillStyle = 'rgba(212, 175, 55, 0.9)'; // Gold color
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(watermarkText, canvas.width - 20, canvas.height - 20);
      
      resolve(canvas.toDataURL('image/png').split(',')[1]);
    };
    img.onerror = () => resolve(base64Image);
  });
};

/**
 * Hàm chính điều khiển AI Stylist thiết kế móng
 */
export const generateNailArt = async (imageFile: File, stylePrompt?: string): Promise<string> => {
  const base64Data = await fileToBase64(imageFile);
  
  const baseInstruction = `You are a world-class luxury nail artist at 'La Perla Nails & Beauty'. 
  Based on the hand in this photo, transform the nails with a stunning, high-end, and photorealistic design. 
  Ensure the skin looks natural and the nail art is sharp, clean, and elegant.`;

  const finalPrompt = stylePrompt 
    ? `${baseInstruction} The specific style requested is: "${stylePrompt}". Make it look better than a magazine cover.`
    : `${baseInstruction} Create a trendy, luxurious design that would suit this hand shape and skin tone perfectly.`;

  try {
    // FIX: Always use new GoogleGenAI({apiKey: process.env.API_KEY}) directly before call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: imageFile.type } },
          { text: finalPrompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const watermarked = await addWatermark(part.inlineData.data);
        return watermarked;
      }
    }
    throw new Error("AI could not generate an image.");
  } catch (error) {
    console.error("Stylist AI Error:", error);
    throw new Error("Unable to create design. Please try a clearer photo of your hand.");
  }
};

/**
 * AI hỗ trợ viết tin nhắn đặt lịch
 */
export const generateBookingRequest = async (
    services: string[], 
    date: string, 
    timeSlot: string, 
    language: string
): Promise<string> => {
    const prompt = `Write a very polite and friendly booking request for a nail salon.
    Services: ${services.join(', ')}. Date: ${date}. Time: ${timeSlot}.
    Language: ${language}. Keep it short and professional.`;

    try {
        // FIX: Always use new GoogleGenAI({apiKey: process.env.API_KEY}) directly before call
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        return `I'd like to book ${services.join(', ')} on ${date} at ${timeSlot}.`;
    }
};
