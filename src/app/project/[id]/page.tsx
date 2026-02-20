"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  imageUrl?: string;
}

interface Project {
  id: string;
  name: string;
  budget: number;
  spent: number;
  createdAt: string;
  expenses?: Expense[];
}

const CATEGORIES = ["חומרי בניין", "עבודה", "חשמל", "אינסטלציה", "ריצוף", "צבע", "מטבח", "אמבטיה", "אחר"];

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quoteInputRef = useRef<HTMLInputElement>(null);
  
  const [project, setProject] = useState<Project | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showQuoteAnalysis, setShowQuoteAnalysis] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  const [quoteAnalysis, setQuoteAnalysis] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const savedProjects = localStorage.getItem("projects");
    if (savedProjects) {
      const projects: Project[] = JSON.parse(savedProjects);
      const found = projects.find((p) => p.id === params.id);
      if (found) {
        setProject(found);
      } else {
        router.push("/dashboard");
      }
    }
  }, [params.id, router]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      setScanning(true);
      try {
        const response = await fetch("/api/scan-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.description) setDescription(data.description);
          if (data.amount) setAmount(data.amount.toString());
          if (data.category && CATEGORIES.includes(data.category)) setCategory(data.category);
        }
      } catch (error) {
        console.error("Scan error:", error);
      }
      setScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleQuoteUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setShowQuoteAnalysis(true);
      setAnalyzing(true);
      setQuoteAnalysis(null);
      try {
        const response = await fetch("/api/analyze-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, budget: project?.budget }),
        });
        if (response.ok) {
          const data = await response.json();
          setQuoteAnalysis(data.analysis);
        } else {
          setQuoteAnalysis("לא הצלחתי לנתח את ההצעה. נסה שוב.");
        }
      } catch {
        setQuoteAnalysis("שגיאה בניתוח. נסה שוב.");
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAIChat = async () => {
    if (!chatMessage.trim() || !project) return;
    const userMessage = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);
    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          context: {
            projectName: project.name,
            budget: project.budget,
            spent: project.spent,
            remaining: project.budget - project.spent,
            expensesCount: project.expenses?.length || 0,
          }
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { role: "assistant", content: data.response }]);
      }
    } catch {
      setChatHistory(prev => [...prev, { role: "assistant", content: "מצטער, לא הצלחתי לענות." }]);
    }
    setChatLoading(false);
  };

  const handleAddExpense = () => {
    if (!project || !description || !amount) return;
    const newExpense: Expense = {
      id: Date.now().toString(),
      description,
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString(),
      imageUrl: selectedImage || undefined,
    };
    const updatedProject = {
      ...project,
      expenses: [...(project.expenses || []), newExpense],
      spent: project.spent + parseFloat(amount),
    };
    const savedProjects = localStorage.getItem("projects");
    if (savedProjects) {
      const projects: Project[] = JSON.parse(savedProjects);
      const updatedProjects = projects.map((p) => p.id === project.id ? updatedProject : p);
      localStorage.setItem("projects", JSON.stringify(updatedProjects));
    }
    setProject(updatedProject);
    setShowAddExpense(false);
    setDescription("");
    setAmount("");
    setCategory(CATEGORIES[0]);
    setSelectedImage(null);
  };

  if (!project) return null;

  const budgetPercentage = (project.spent / project.budget) * 100;
  const remaining = project.budget - project.spent;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="h-11 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">‹ חזרה</Link>
          <span className="text-base font-semibold text-gray-900">{project.name}</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Budget Overview */}
        <div className="grid md:grid-cols-3 gap-px bg-gray-100 rounded-2xl overflow-hidden mb-8">
          <div className="bg-white p-8">
            <p className="text-sm text-gray-500 mb-1">תקציב</p>
            <p className="text-3xl font-semibold text-gray-900">₪{project.budget.toLocaleString()}</p>
          </div>
          <div className="bg-white p-8">
            <p className="text-sm text-gray-500 mb-1">הוצאות</p>
            <p className="text-3xl font-semibold text-gray-900">₪{project.spent.toLocaleString()}</p>
          </div>
          <div className="bg-white p-8">
            <p className="text-sm text-gray-500 mb-1">נותר</p>
            <p className="text-3xl font-semibold text-gray-900">₪{remaining.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-12">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>התקדמות</span>
            <span>{budgetPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 rounded-full" style={{ width: `${Math.min(budgetPercentage, 100)}%` }} />
          </div>
        </div>

        {/* AI Tools */}
        <div className="border border-gray-100 rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">כלי AI</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => quoteInputRef.current?.click()}
              className="text-right border border-gray-100 rounded-xl p-6 hover:border-gray-300 transition-colors"
            >
              <input ref={quoteInputRef} type="file" accept="image/*" onChange={handleQuoteUpload} className="hidden" />
              <p className="font-medium text-gray-900 mb-1">ניתוח הצעת מחיר</p>
              <p className="text-sm text-gray-500">העלה הצעה לניתוח</p>
            </button>
            <button
              onClick={() => setShowAIChat(true)}
              className="text-right border border-gray-100 rounded-xl p-6 hover:border-gray-300 transition-colors"
            >
              <p className="font-medium text-gray-900 mb-1">עוזר AI</p>
              <p className="text-sm text-gray-500">שאל שאלות על השיפוץ</p>
            </button>
            <button
              onClick={() => { fileInputRef.current?.click(); setShowAddExpense(true); }}
              className="text-right border border-gray-100 rounded-xl p-6 hover:border-gray-300 transition-colors"
            >
              <p className="font-medium text-gray-900 mb-1">סריקת קבלה</p>
              <p className="text-sm text-gray-500">צלם והוסף אוטומטית</p>
            </button>
          </div>
        </div>

        {/* Alert */}
        {budgetPercentage > 80 && (
          <div className="border border-gray-900 rounded-2xl p-6 mb-8">
            <p className="font-medium text-gray-900">שים לב</p>
            <p className="text-sm text-gray-600 mt-1">
              {budgetPercentage > 100 
                ? `חרגת מהתקציב ב-₪${Math.abs(remaining).toLocaleString()}`
                : `נשארו ₪${remaining.toLocaleString()} מתוך התקציב (${(100 - budgetPercentage).toFixed(0)}%)`
              }
            </p>
          </div>
        )}

        {/* Expenses */}
        <div className="border border-gray-100 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">הוצאות</h2>
            <button
              onClick={() => setShowAddExpense(true)}
              className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm hover:bg-gray-800"
            >
              הוסף הוצאה
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />

          {!project.expenses || project.expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-12">אין הוצאות עדיין</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {project.expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    {expense.imageUrl && (
                      <img src={expense.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-500">{expense.category} · {new Date(expense.date).toLocaleDateString("he-IL")}</p>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900">₪{expense.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">הוסף הוצאה</h2>
            
            <div className="mb-6">
              {selectedImage ? (
                <div className="relative">
                  <img src={selectedImage} alt="" className="w-full h-40 object-cover rounded-xl" />
                  <button onClick={() => setSelectedImage(null)} className="absolute top-2 left-2 bg-black/50 text-white w-8 h-8 rounded-full">✕</button>
                  {scanning && (
                    <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl">
                      <p className="text-gray-600">סורק...</p>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors"
                >
                  <span className="text-sm">צלם קבלה או העלה תמונה</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-2">תיאור</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="לדוגמה: חומרי בניין" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">סכום (₪)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">קטגוריה</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 bg-white">
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={handleAddExpense} disabled={!description || !amount} className="flex-1 bg-gray-900 text-white py-3 rounded-full hover:bg-gray-800 disabled:opacity-30">הוסף</button>
              <button onClick={() => { setShowAddExpense(false); setDescription(""); setAmount(""); setSelectedImage(null); }} className="flex-1 border border-gray-200 text-gray-900 py-3 rounded-full hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Modal */}
      {showAIChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg h-[500px] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">עוזר AI</h2>
              <button onClick={() => setShowAIChat(false)} className="text-gray-500 hover:text-gray-900">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatHistory.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p className="mb-6">שאל שאלה על השיפוץ</p>
                  <div className="space-y-2 text-sm">
                    <button onClick={() => setChatMessage("האם התקציב שלי סביר?")} className="block w-full text-right border border-gray-100 rounded-lg p-3 hover:border-gray-300">האם התקציב שלי סביר?</button>
                    <button onClick={() => setChatMessage("מה לבדוק בחוזה?")} className="block w-full text-right border border-gray-100 rounded-lg p-3 hover:border-gray-300">מה לבדוק בחוזה?</button>
                    <button onClick={() => setChatMessage("איך לחסוך בעלויות?")} className="block w-full text-right border border-gray-100 rounded-lg p-3 hover:border-gray-300">איך לחסוך בעלויות?</button>
                  </div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`p-4 rounded-xl ${msg.role === "user" ? "bg-gray-900 text-white mr-8" : "border border-gray-100 ml-8"}`}>
                  {msg.content}
                </div>
              ))}
              {chatLoading && <div className="border border-gray-100 ml-8 p-4 rounded-xl text-gray-500">חושב...</div>}
            </div>
            
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAIChat()} placeholder="שאל שאלה..." className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-gray-900" />
                <button onClick={handleAIChat} disabled={!chatMessage.trim() || chatLoading} className="bg-gray-900 text-white px-6 py-3 rounded-full hover:bg-gray-800 disabled:opacity-30">שלח</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quote Analysis Modal */}
      {showQuoteAnalysis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">ניתוח הצעת מחיר</h2>
              <button onClick={() => setShowQuoteAnalysis(false)} className="text-gray-500 hover:text-gray-900">✕</button>
            </div>
            {analyzing ? (
              <div className="text-center py-12 text-gray-500">מנתח...</div>
            ) : (
              <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">{quoteAnalysis}</div>
            )}
            <button onClick={() => setShowQuoteAnalysis(false)} className="w-full mt-6 border border-gray-200 text-gray-900 py-3 rounded-full hover:bg-gray-50">סגור</button>
          </div>
        </div>
      )}
    </div>
  );
}
