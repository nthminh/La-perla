
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MicIcon, SparklesIcon, XMarkIcon, ArrowRightIcon, RobotIcon, VolumeUpIcon, VolumeOffIcon } from './Icons';
import { ServiceCategory, StaffProfile } from '../types';
import { Translation } from '../translations';

// Use import.meta.env for Vite or fall back to process.env
const API_KEY = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;

interface ChatWidgetProps {
    t: Translation;
    pricingData: ServiceCategory[];
    staffList: StaffProfile[];
    knowledgeBase?: string; // New: Custom Knowledge
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ t, pricingData, staffList, knowledgeBase }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', text: "Hello! I'm your La Perla assistant. Ask me about our prices, services, or staff!" }
    ]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Scroll to bottom
    useEffect(() => {
        if (isOpen && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'en-AU'; // Australian accent preference
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                handleSend(transcript); // Auto-send when speaking stops
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.warn("Speech recognition error:", event.error);
                setIsListening(false);
                
                // Specific handling for permission errors
                if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                    alert("Microphone access was denied. Please allow microphone permissions in your browser settings (look for a lock 🔒 icon in the address bar) to use voice chat.");
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Voice input is not supported in this browser. Please try Chrome or Safari.");
            return;
        }
        
        try {
            if (isListening) {
                recognitionRef.current.stop();
            } else {
                // Stop TTS if speaking
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
                
                recognitionRef.current.start();
                setIsListening(true);
            }
        } catch (e) {
            console.error("Microphone start/stop error:", e);
            setIsListening(false);
        }
    };

    const speak = (text: string) => {
        if (!voiceEnabled) return;
        
        try {
            // Cancel current speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-AU'; // Prefer Australian English
            
            // Find a female voice if possible
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => v.name.includes("Female") || v.name.includes("Google US English") || v.name.includes("Samantha"));
            if (femaleVoice) utterance.voice = femaleVoice;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = (e) => {
                console.warn("TTS Error:", e);
                setIsSpeaking(false);
            };

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn("Speech Synthesis failed:", e);
            setIsSpeaking(false);
        }
    };

    const handleSend = async (textToSend: string = input) => {
        if (!textToSend.trim()) return;

        // 1. Add User Message
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsThinking(true);

        try {
            // 2. Prepare Context (Grounding Data)
            // Format Staff List
            const staffNames = staffList.map(s => s.name).join(', ');

            // Format Price List cleanly
            const priceListText = pricingData.map(category => {
                const categoryName = t.serviceCategories[category.categoryKey] || category.categoryKey;
                const services = category.services.map(s => {
                    const name = s.displayName || t.serviceNames[s.nameKey] || s.nameKey;
                    return `  - ${name}: ${s.price}`;
                }).join('\n');
                return `${categoryName}:\n${services}`;
            }).join('\n\n');

            // Format Custom Knowledge Base
            const customKnowledge = knowledgeBase ? `
            ADDITIONAL SHOP INFORMATION & RULES:
            ${knowledgeBase}
            ` : "";

            // Construct System Instruction (The Brain)
            const systemInstruction = `
            You are the friendly and professional AI receptionist for 'La Perla Nails & Beauty' salon in Plumpton, NSW.
            
            YOUR KNOWLEDGE BASE (Strictly follow this):
            ------------------------------------------------
            STAFF MEMBERS: ${staffNames}
            
            SERVICES & PRICES (AUD):
            ${priceListText}

            ${customKnowledge}
            ------------------------------------------------
            
            RULES:
            1. **Prices:** Only quote prices exactly as listed above. If a service is not listed, apologize and say you don't have that information.
            2. **Booking:** You CANNOT make bookings directly. If asked to book, tell them to use the "Booking" tab in this app or call (02) 9625 8194.
            3. **Style:** Keep answers short (max 2-3 sentences), warm, and helpful. Use emojis occasionally.
            4. **Unknowns:** If you don't know the answer based on the list above, suggest they call the salon. Do not make up information.
            `;

            // 3. Call Gemini API
            const ai = new GoogleGenAI({ apiKey: API_KEY! });
            
            // Format history for the API
            const chatHistory = messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.text }]
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    ...chatHistory,
                    { role: 'user', parts: [{ text: textToSend }] }
                ],
                config: {
                    systemInstruction: systemInstruction, // Inject knowledge here
                }
            });

            // Extract text correctly for @google/genai SDK
            const replyText = response.text || "I'm sorry, I couldn't process that. Please try again.";
            
            // 4. Add Assistant Message
            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: replyText };
            setMessages(prev => [...prev, assistantMsg]);
            
            // 5. Speak response (with small delay to satisfy browser autoplay policies)
            if (voiceEnabled) {
                setTimeout(() => speak(replyText), 100);
            }

        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg: Message = { id: Date.now().toString(), role: 'assistant', text: "Sorry, I'm having trouble connecting to the brain right now. Please try again later." };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-[999] flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="pointer-events-auto bg-white w-80 md:w-96 rounded-2xl shadow-2xl border border-gold-leaf/20 mb-4 overflow-hidden flex flex-col animate-fade-in-up origin-bottom-right max-h-[500px]">
                    {/* Header */}
                    <div className="bg-charcoal text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-gold-leaf/20 p-1.5 rounded-full">
                                <RobotIcon className="w-5 h-5 text-gold-leaf" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">La Perla Assistant</h3>
                                <p className="text-[10px] text-gray-300">Ask about prices & services</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="hover:text-gold-leaf transition-colors">
                                {voiceEnabled ? <VolumeUpIcon className="w-4 h-4"/> : <VolumeOffIcon className="w-4 h-4 text-gray-500"/>}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="hover:text-red-400 transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 bg-gray-50 p-4 overflow-y-auto custom-scrollbar min-h-[300px]">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-xl p-3 text-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-gold-leaf text-white rounded-br-none' 
                                        : 'bg-white text-charcoal shadow-sm border border-gray-100 rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start mb-3">
                                <div className="bg-white text-gray-400 p-3 rounded-xl rounded-bl-none shadow-sm border border-gray-100 text-xs italic flex items-center gap-1">
                                    <SparklesIcon className="w-3 h-3 animate-spin" /> Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                        <button 
                            onClick={toggleListening}
                            className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            title={isListening ? "Listening..." : "Tap to Speak"}
                        >
                            <MicIcon className="w-5 h-5" />
                        </button>
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything..." 
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-gold-leaf focus:ring-1 focus:ring-gold-leaf"
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isThinking}
                            className="p-2 bg-gold-leaf text-white rounded-full hover:bg-charcoal transition-colors disabled:opacity-50"
                        >
                            <ArrowRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                    isOpen ? 'bg-charcoal rotate-90' : 'bg-gradient-to-r from-gold-leaf to-yellow-500'
                }`}
            >
                {isOpen ? (
                    <XMarkIcon className="w-6 h-6 text-white" />
                ) : (
                    <div className="relative">
                        <RobotIcon className="w-7 h-7 text-white" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </div>
                )}
            </button>
        </div>
    );
};
