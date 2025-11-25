import { GoogleGenAI, Modality } from "@google/genai";

// Use import.meta.env for Vite or fall back to process.env
const API_KEY = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

/**
 * Converts a File object to a base64 encoded string.
 * @param file The file to convert.
 * @returns A promise that resolves with the base64 string.
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
 * Creates a subtle corner watermark.
 * Less intrusive, placed in the bottom right corner to avoid the nail art.
 * @param ctx The context of the main canvas.
 * @param width The width of the main canvas.
 * @param height The height of the main canvas.
 */
const applyCornerWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const watermarkText = 'La Perla AI Stylist';
    
    // Aesthetic font settings
    const fontSize = Math.max(16, Math.round(width / 25)); // Responsive but small font size
    ctx.font = `500 ${fontSize}px "Poppins", sans-serif`;
    
    // Positioning: Bottom Right with padding
    const padding = fontSize;
    const x = width - padding;
    const y = height - padding;

    // Shadow for readability on both dark and light backgrounds
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Text Style
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'; // Crisp white with slight transparency
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    ctx.fillText(watermarkText, x, y);

    // Add a small golden accent line below text
    ctx.shadowColor = "transparent"; // Remove shadow for line
    ctx.fillStyle = '#D4AF37'; // Gold
    ctx.fillRect(x - ctx.measureText(watermarkText).width, y + 4, ctx.measureText(watermarkText).width, 2);
};


/**
 * Adds a "La Perla" watermark to a base64 encoded image.
 * @param base64Image The base64 string of the image (without data URI prefix).
 * @returns A promise that resolves with the watermarked base64 string.
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
      if (!ctx) {
        // If canvas is not supported, return original image
        return resolve(base64Image);
      }
      
      // Draw the original image first
      ctx.drawImage(img, 0, 0);
      
      // Apply the corner watermark
      applyCornerWatermark(ctx, canvas.width, canvas.height);
      
      // Get the new base64 string from the canvas
      const watermarkedBase64 = canvas.toDataURL('image/png').split(',')[1];
      resolve(watermarkedBase64);
    };

    img.onerror = (error) => {
      console.error("Error loading image for watermarking:", error);
      // Fallback: If watermarking fails, resolve with the original image to not break the flow.
      resolve(base64Image); 
    };
  });
};


export const generateNailArt = async (imageFile: File, stylePrompt?: string): Promise<string> => {
  const base64Data = await fileToBase64(imageFile);
  
  const enhancementInstruction = 'The final image should be high-resolution and sharp, with crisp, clear details on the nail art, even if the original photo is slightly blurry.';
  
  const basePrompt = `Based on the hand and nails in this image, edit the nails to feature a beautiful, trendy, and luxurious nail art design. Make the result look photorealistic and high-end. ${enhancementInstruction}`;
  const prompt = stylePrompt
    ? `Based on the hand and nails in this image, edit the nails to feature a design inspired by "${stylePrompt}". Make the result look beautiful, trendy, luxurious, photorealistic, and high-end. ${enhancementInstruction}`
    : basePrompt;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: imageFile.type,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        // Add watermark to the generated image before returning
        const watermarkedImage = await addWatermark(part.inlineData.data);
        return watermarkedImage;
      }
    }
    throw new Error("No image was generated by the API.");

  } catch (error) {
    console.error("Error generating nail art:", error);
    throw new Error("Sorry, we couldn't create a nail design. Please try another photo.");
  }
};


export const generateBookingRequest = async (
    services: string[], 
    date: string, 
    timeSlot: string, 
    language: string
): Promise<string> => {
    const serviceList = services.join(', ');
    const prompt = `You are a helpful and friendly salon assistant writing on behalf of a customer. 
    The customer has selected the following services: ${serviceList}.
    Their preferred date is ${date} during the ${timeSlot}.
    Draft a short, polite, and natural-sounding booking request note in the first person (e.g., "I would like to book...").
    The language for the response must be ${language}.
    Do not include placeholders like [Your Name]. Just write the message itself.`;

    try {
        const aiWithKey = new GoogleGenAI({ apiKey: API_KEY! });
        const response = await aiWithKey.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating booking request:", error);
        // Fallback message in case of API error
        return `I would like to book the following services: ${serviceList}. I am available on ${date} in the ${timeSlot}.`;
    }
};