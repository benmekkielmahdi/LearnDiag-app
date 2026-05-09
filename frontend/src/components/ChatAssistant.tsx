import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, BrainCircuit, Mic, MicOff, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { predictionService } from '../api/predictionService';
import { FormattedText } from './FormattedText';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAssistantProps {
  strategyContext?: string | null;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ 
  strategyContext, 
  isOpen: externalIsOpen,
  onOpen,
  onClose 
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  
  const toggleChat = () => {
    if (isOpen) {
      onClose ? onClose() : setInternalIsOpen(false);
    } else {
      onOpen ? onOpen() : setInternalIsOpen(true);
    }
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastLang, setLastLang] = useState<'fr-FR' | 'ar-SA'>('fr-FR');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      if (strategyContext) {
        setMessages([{ role: 'assistant', content: "Bonjour ! J'ai lu la stratégie pédagogique proposée. Souhaitez-vous que l'on en discute ou que je vous donne plus de détails ?" }]);
      } else {
        setMessages([{ role: 'assistant', content: "Bonjour ! Je suis votre assistant LearnDiag. Comment puis-je vous aider aujourd'hui ?" }]);
      }
    }
  }, [strategyContext, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lastLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
        setLastLang(recognition.lang);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const data = await predictionService.chat(userMsg, strategyContext || undefined);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, j'ai rencontré une erreur. Vérifiez que votre serveur IA est bien lancé." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              width: isMaximized ? 'min(90vw, 800px)' : 'min(90vw, 400px)',
              height: isMaximized ? 'min(90vh, 700px)' : '500px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 bg-card/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300"
          >
            {/* Header */}
            <div className="p-4 bg-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Assistant LearnDiag</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] opacity-80 uppercase tracking-widest font-black">AI Local Actif</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMaximized(!isMaximized)} 
                  className="hover:bg-white/10 p-2 rounded-lg transition-colors"
                  title={isMaximized ? "Réduire" : "Agrandir"}
                >
                  {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button onClick={toggleChat} className="hover:bg-white/10 p-2 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-primary'
                    }`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20' 
                        : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-tl-none'
                    }`}>
                      {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <FormattedText text={msg.content} className="text-foreground" />
                  )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-white/5 flex gap-1">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5">
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question..."
                  className="w-full pl-4 pr-12 py-3 bg-card border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                />
                <div className="absolute right-2 top-1.5 flex gap-1 items-center">
                  <button
                    type="button"
                    onClick={startListening}
                    className={`p-2 rounded-xl transition-all ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-primary'
                    }`}
                    title="Parler"
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="p-2 bg-primary text-white rounded-xl shadow-md shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                  >
                    {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-primary text-white'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
        )}
      </motion.button>
    </div>
  );
};
