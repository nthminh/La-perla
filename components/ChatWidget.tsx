import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MicIcon, SparklesIcon, XMarkIcon, ArrowRightIcon, RobotIcon, VolumeUpIcon, VolumeOffIcon } from './Icons';
import { ServiceCategory, StaffProfile } from '../types';
import { Translation } from '../translations';

interface ChatWidgetProps {
    t: Translation;
    pricingData: ServiceCategory[];
    staffList: StaffProfile[];
    knowledgeBase?: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ t, pricingData, staffList, knowledgeBase }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', text: "Chào bạn! Mình là trợ lý ảo của La Perla. Bạn cần hỏi về giá dịch vụ hay tìm thợ nào ạ? ✨" }
    ]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (isOpen && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'vi-VN';
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                handleSend(transcript);
                setIsListening(false);
            };
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) recognitionRef.current.stop();
        else {
            window.speechSynthesis.cancel();
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const speak = (text: string) => {
        if (!voiceEnabled) return;
        window.speechSynthesis.cancel();
        // FIX: SynthesisUtterance corrected to SpeechSynthesisUtterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        window.speechSynthesis.speak(utterance);
    };

    const handleSend = async (textToSend: string = input) => {
        if (!textToSend.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsThinking(true);

        try {
            const staffInfo = staffList.map(s => s.name).join(', ');
            const priceInfo = pricingData.map(cat => {
                const catName = t.serviceCategories[cat.categoryKey] || cat.categoryKey;
                const svcs = cat.services.map(s => `${s.displayName || s.nameKey}: ${s.price}`).join('\n');
                return `${catName}:\n${svcs}`;
            }).join('\n\n');

            const systemInstruction = `
            Bạn là lễ tân AI của tiệm 'La Perla Nails & Beauty' tại Plumpton, NSW.
            Dữ liệu nhân viên (24 người): Amy, Angela, Chị Hạnh, Chloe, Ellie, Fiona, Hiền, Ivy, Kaylee, Khuê, Lê, Linh, Mỹ Anh, Phượng, Song, Sue, Tâm, Thai, Tina, Trang, Trang Bé, Vivian, Vy, Joe.
            Bảng giá:
            ${priceInfo}
            Quy tắc: 
            1. Trả lời bằng ngôn ngữ khách sử dụng (Tiếng Việt hoặc Tiếng Anh). 
            2. Chỉ báo giá có trong danh sách. Nếu khách hỏi dịch vụ không có, hãy xin lỗi và bảo khách gọi (02) 9625 8194. 
            3. Nếu khách muốn đặt lịch, hướng dẫn họ vào tab 'Booking' hoặc gọi hotline. 
            4. Trả lời ngắn gọn, thân thiện, sử dụng emoji.`;

            // FIX: Always use new GoogleGenAI({apiKey: process.env.API_KEY}) directly before call
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
                    { role: 'user', parts: [{ text: textToSend }] }
                ],
                config: { systemInstruction }
            });

            const reply = response.text || "Xin lỗi, mình đang bận một chút, bạn thử lại sau nhé!";
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: reply }]);
            if (voiceEnabled) speak(reply);

        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: "Lỗi kết nối bộ não AI." }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-[999] flex flex-col items-end pointer-events-none">
            {isOpen && (
                <div className="pointer-events-auto bg-white w-80 md:w-96 rounded-2xl shadow-2xl border border-gold-leaf/20 mb-4 overflow-hidden flex flex-col animate-fade-in-up origin-bottom-right max-h-[500px]">
                    <div className="bg-charcoal text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <RobotIcon className="w-5 h-5 text-gold-leaf" />
                            <div><h3 className="font-bold text-sm">La Perla AI</h3><p className="text-[10px] text-gray-400">Online tư vấn 24/7</p></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setVoiceEnabled(!voiceEnabled)}>{voiceEnabled ? <VolumeUpIcon className="w-4 h-4"/> : <VolumeOffIcon className="w-4 h-4 text-gray-500"/>}</button>
                            <button onClick={() => setIsOpen(false)}><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <div className="flex-1 bg-gray-50 p-4 overflow-y-auto custom-scrollbar min-h-[300px]">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-xl p-3 text-sm ${msg.role === 'user' ? 'bg-gold-leaf text-white rounded-br-none' : 'bg-white text-charcoal shadow-sm border border-gray-100 rounded-bl-none'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isThinking && <div className="text-xs text-gray-400 italic animate-pulse">La Perla AI đang trả lời...</div>}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-3 bg-white border-t flex items-center gap-2">
                        <button onClick={toggleListening} className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}><MicIcon className="w-5 h-5" /></button>
                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Hỏi giá móng, nối mi..." className="flex-1 bg-gray-50 border rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-gold-leaf" />
                        <button onClick={() => handleSend()} className="p-2 bg-gold-leaf text-white rounded-full"><ArrowRightIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="pointer-events-auto w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all bg-gradient-to-r from-gold-leaf to-yellow-600 transform hover:scale-110">
                {isOpen ? <XMarkIcon className="w-6 h-6 text-white" /> : <RobotIcon className="w-7 h-7 text-white" />}
            </button>
        </div>
    );
};
