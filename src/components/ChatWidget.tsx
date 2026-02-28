"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Minus } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "היי! 👋 אני השיפוצניק שלך, כאן לעזור עם כל שאלה על עיצוב הבית ושיפוצים. מה תרצה לדעת?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => 
    `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  const placeholderExamples = [
    "כמה עולה שיפוץ מטבח?",
    "איך בוחרים קבלן אמין?",
    "מה כולל שיפוץ קומפלט?",
    "כמה זמן לוקח שיפוץ דירה?",
    "איך מתכננים תקציב לשיפוץ?",
    "מה לבדוק לפני שסוגרים הצעה?",
    "האם צריך אישורים לשיפוץ?",
  ];

  // Rotate placeholder every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Show bubble after 3 seconds
  useEffect(() => {
    if (!bubbleDismissed && !isOpen) {
      const timer = setTimeout(() => {
        setShowBubble(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [bubbleDismissed, isOpen]);

  // Hide bubble when chat opens
  useEffect(() => {
    if (isOpen) {
      setShowBubble(false);
      setBubbleDismissed(true);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          history: messages,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "מצטער, משהו השתבש. נסו שוב 🙏" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "שגיאת חיבור. נסו שוב בעוד רגע." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Bubble - Points to robot button */}
      {showBubble && !isOpen && (
        <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
          <div 
            onClick={() => setIsOpen(true)}
            className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-[220px] border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBubble(false);
                setBubbleDismissed(true);
              }}
              className="absolute -top-2 -left-2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xs"
            >
              ✕
            </button>
            {/* Arrow pointing down to robot */}
            <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
            {/* Content - simpler, just text */}
            <div className="text-center">
              <p className="text-gray-800 font-medium text-sm mb-1">צריך עזרה?</p>
              <p className="text-gray-500 text-xs leading-relaxed">
                יש לי תשובות לכל שאלה
              </p>
              <span className="mt-2 text-emerald-600 text-xs font-medium inline-block">
                לחצו לשיחה ↓
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chat Button - Right side, bottom - Always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-4 z-50 flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-700 shadow-lg"
            : "w-12 h-12 hover:scale-110 drop-shadow-lg"
        }`}
        aria-label={isOpen ? "סגור צ'אט" : "פתח צ'אט"}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <>
            <img src="/robot-support.png" alt="Support" className="w-12 h-12 object-contain" />
            {/* Notification dot */}
            {!bubbleDismissed && (
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </>
        )}
      </button>

      {/* Chat Window - Right side, bottom */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-[350px] max-w-[calc(100vw-2rem)] h-[450px] max-h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-emerald-600 text-white px-4 py-3 flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/robot-support.png" alt="Support Bot" className="w-12 h-12 object-contain" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">ShiputzAI Support</h3>
              <p className="text-xs text-emerald-100">בדרך כלל עונים מיד</p>
            </div>
            {/* Minimize & Close buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="מזער"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setBubbleDismissed(true);
                }}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="סגור"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-end gap-2 ${msg.role === "user" ? "justify-start flex-row-reverse" : "justify-end"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 bg-white rounded-full flex-shrink-0 overflow-hidden shadow-sm border border-gray-100">
                    <img src="/robot-support.png" alt="" className="w-full h-full object-contain" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-tr-sm"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end gap-2 justify-end">
                <div className="w-8 h-8 bg-white rounded-full flex-shrink-0 overflow-hidden shadow-sm border border-gray-100">
                  <img src="/robot-support.png" alt="" className="w-full h-full object-contain" />
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 rounded-tl-sm">
                  <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholderExamples[placeholderIndex]}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-500 text-right transition-all"
                dir="rtl"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
