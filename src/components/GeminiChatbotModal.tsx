/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, X, Sparkles, Globe, User, RefreshCw, 
  ChevronDown, ExternalLink, HelpCircle, MessageSquare
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; url: string }>;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content: "Bonjour et bienvenue sur **TSR TRANSIT** ! 🇧🇫\n\nJe suis votre assistant voyage intelligent propulsé par Gemini & Google Search. Je peux vous renseigner sur les horaires de départ, les tarifs de billets, l'expédition de colis TSR Express, les paiements Orange/Moov Money et l'état des routes en temps réel.\n\nComment puis-je vous aider aujourd'hui ?",
    timestamp: 'À l\'instant',
  },
];

const QUICK_SUGGESTIONS = [
  "🚌 Horaires départs Ouaga - Bobo aujourd'hui",
  "📦 Tarifs envoi colis TSR Express",
  "☀️ Météo et routes au Burkina Faso",
  "💳 Comment payer par Orange Money (*144#) ?",
  "🧳 Nombre de kilos de bagages autorisés"
];

export const GeminiChatbotModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build history for multi-turn chat
      const historyPayload = messages
        .filter(m => m.id !== 'msg-welcome')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          userMessage: text,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const botMessage: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        role: 'assistant',
        content: data.text || "Désolé, une réponse vide a été reçue.",
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: "Désolé, une erreur de connexion au serveur Gemini est survenue. Veuillez vérifier votre connexion ou réessayer.",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-500 text-white p-3.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 border-2 border-white/40 cursor-pointer group"
          title="Ouvrir l'assistant IA TSR TRANSIT"
          aria-label="Assistant IA TSR TRANSIT"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-300 rounded-full animate-ping"></span>
          </div>
          <span className="hidden sm:inline font-bold text-xs pr-1">Assistant TSR IA</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[620px] z-50 flex flex-col bg-slate-900 border border-slate-700 shadow-2xl sm:rounded-2xl overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-800 via-indigo-900 to-slate-950 p-4 border-b border-blue-800/60 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md ring-2 ring-amber-400/30">
                <Sparkles className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold leading-none">Assistant TSR TRANSIT</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-semibold border border-emerald-500/40">
                    En ligne
                  </span>
                </div>
                <p className="text-[11px] text-blue-200 mt-0.5 flex items-center gap-1">
                  <span>Gemini 3.8 Flash</span>
                  <span>•</span>
                  <span className="text-amber-300 font-medium">Google Search Grounding</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Réinitialiser la conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Fermer le chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/90 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-xs'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>

                  {/* Search Grounding Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/80 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold">
                        <Globe className="w-3 h-3 text-amber-400" />
                        <span>Sources vérifiées via Google Search :</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.slice(0, 3).map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-slate-700 text-blue-300 px-2 py-0.5 rounded border border-slate-600 transition-colors"
                          >
                            <span className="truncate max-w-[150px]">{src.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className={`block text-[9px] mt-1 text-right ${
                    msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-800 border border-slate-700 px-3.5 py-2.5 rounded-2xl rounded-tl-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-slate-300 ml-1">Recherche &amp; synthèse en cours...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="bg-slate-900 border-t border-slate-800 px-3 py-2">
            <span className="text-[10px] font-semibold text-slate-400 block mb-1.5">
              Suggestions rapides :
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_SUGGESTIONS.map((sugg, i) => (
                <button
                  key={i}
                  disabled={isLoading}
                  onClick={() => handleSendMessage(sugg)}
                  className="bg-slate-800 hover:bg-slate-700 text-blue-200 border border-slate-700 px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {sugg}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Posez votre question (ex: prix Ouaga-Bobo)..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-2.5 rounded-xl font-bold transition-colors cursor-pointer shadow-md shrink-0"
              aria-label="Envoyer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
