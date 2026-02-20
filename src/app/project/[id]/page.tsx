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
  contractor?: string;
}

const CATEGORIES = [
  "חומרי בניין",
  "עבודה",
  "חשמל",
  "אינסטלציה",
  "ריצוף",
  "צבע",
  "מטבח",
  "אמבטיה",
  "אחר",
];

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
  
  // Expense form
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // AI Chat
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Quote Analysis
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
          if (data.category && CATEGORIES.includes(data.category)) {
            setCategory(data.category);
          }
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
      } catch (error) {
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
    } catch (error) {
      setChatHistory(prev => [...prev, { role: "assistant", content: "מצטער, לא הצלחתי לענות. נסה שוב." }]);
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
      const updatedProjects = projects.map((p) =>
        p.id === project.id ? updatedProject : p
      );
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="h-11 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              ‹ חזרה
            </Link>
            <span className="text-base font-semibold text-gray-900">
              {project.name}
            </span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Budget Overview */}
        <div className="bg-white rounded-2xl p-8 mb-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">תקציב</p>
              <p className="text-3xl font-semibold">₪{project.budget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">הוצאות</p>
              <p className="text-3xl font-semibold">₪{project.spent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">נותר</p>
              <p className={`text-3xl font-semibold ${remaining < 0 ? "text-red-600" : ""}`}>
                ₪{remaining.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetPercentage > 100
                    ? "bg-red-500"
                    : budgetPercentage > 80
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {budgetPercentage.toFixed(0)}% מהתקציב נוצל
            </p>
          </div>
        </div>

        {/* AI Tools */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-6 text-white">
          <h2 className="text-xl font-semibold mb-4">כלי AI</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => quoteInputRef.current?.click()}
              className="bg-white/20 hover:bg-white/30 rounded-xl p-4 text-right transition-colors"
            >
              <input
                ref={quoteInputRef}
                type="file"
                accept="image/*"
                onChange={handleQuoteUpload}
                className="hidden"
              />
              <p className="font-semibold mb-1">ניתוח הצעת מחיר</p>
              <p className="text-sm text-white/80">העלה הצעה ונבדוק אם המחירים הוגנים</p>
            </button>
            <button
              onClick={() => setShowAIChat(true)}
              className="bg-white/20 hover:bg-white/30 rounded-xl p-4 text-right transition-colors"
            >
              <p className="font-semibold mb-1">עוזר AI</p>
              <p className="text-sm text-white/80">שאל שאלות על השיפוץ שלך</p>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/20 hover:bg-white/30 rounded-xl p-4 text-right transition-colors"
            >
              <p className="font-semibold mb-1">סריקת קבלה</p>
              <p className="text-sm text-white/80">צלם קבלה ונוסיף אוטומטית</p>
            </button>
          </div>
        </div>

        {/* Smart Alerts */}
        {budgetPercentage > 70 && (
          <div className={`rounded-2xl p-6 mb-6 ${budgetPercentage > 90 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-start gap-4">
              <span className="text-2xl">{budgetPercentage > 90 ? '🚨' : '⚠️'}</span>
              <div>
                <p className="font-semibold text-gray-900">
                  {budgetPercentage > 90 ? 'התקציב כמעט נגמר!' : 'שים לב - ניצלת רוב התקציב'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {budgetPercentage > 90 
                    ? `נותרו רק ₪${remaining.toLocaleString()} מתוך התקציב. כדאי לבדוק את ההוצאות.`
                    : `השתמשת ב-${budgetPercentage.toFixed(0)}% מהתקציב. נשארו ₪${remaining.toLocaleString()}.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expenses */}
        <div className="bg-white rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">הוצאות</h2>
            <button
              onClick={() => setShowAddExpense(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-700 transition-colors"
            >
              הוסף הוצאה
            </button>
          </div>

          {/* Hidden file input for receipt scan */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              handleImageSelect(e);
              setShowAddExpense(true);
            }}
            className="hidden"
          />

          {!project.expenses || project.expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין הוצאות עדיין</p>
          ) : (
            <div className="space-y-3">
              {project.expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    {expense.imageUrl && (
                      <img
                        src={expense.imageUrl}
                        alt=""
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {expense.category} • {new Date(expense.date).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold">₪{expense.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-6">הוסף הוצאה</h2>
            
            {/* Image Upload */}
            <div className="mb-6">
              {selectedImage ? (
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="קבלה"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 left-2 bg-black/50 text-white w-8 h-8 rounded-full"
                  >
                    ✕
                  </button>
                  {scanning && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-600">AI סורק את הקבלה...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-blue-600 hover:text-blue-600 transition-colors"
                >
                  <span className="text-2xl mb-1">📷</span>
                  <span className="text-sm">צלם קבלה - AI ימלא אוטומטית</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">תיאור</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="לדוגמה: חומרי בניין מאייס"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">סכום (₪)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">קטגוריה</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-600 bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleAddExpense}
                disabled={!description || !amount}
                className="flex-1 bg-blue-600 text-white py-3 rounded-full text-base font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                הוסף
              </button>
              <button
                onClick={() => {
                  setShowAddExpense(false);
                  setDescription("");
                  setAmount("");
                  setSelectedImage(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-full text-base font-medium hover:bg-gray-200 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Modal */}
      {showAIChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg h-[600px] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">עוזר AI</h2>
              <button
                onClick={() => setShowAIChat(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatHistory.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p className="mb-4">שאל אותי כל שאלה על השיפוץ שלך</p>
                  <div className="space-y-2 text-sm">
                    <button 
                      onClick={() => setChatMessage("האם התקציב שלי סביר?")}
                      className="block w-full text-right bg-gray-100 rounded-lg p-3 hover:bg-gray-200"
                    >
                      "האם התקציב שלי סביר?"
                    </button>
                    <button 
                      onClick={() => setChatMessage("מה עלי לבדוק בחוזה עם קבלן?")}
                      className="block w-full text-right bg-gray-100 rounded-lg p-3 hover:bg-gray-200"
                    >
                      "מה עלי לבדוק בחוזה עם קבלן?"
                    </button>
                    <button 
                      onClick={() => setChatMessage("איך אני יכול לחסוך בעלויות?")}
                      className="block w-full text-right bg-gray-100 rounded-lg p-3 hover:bg-gray-200"
                    >
                      "איך אני יכול לחסוך בעלויות?"
                    </button>
                  </div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white mr-8"
                      : "bg-gray-100 text-gray-900 ml-8"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {chatLoading && (
                <div className="bg-gray-100 text-gray-900 ml-8 p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>חושב...</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAIChat()}
                  placeholder="שאל שאלה..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-base focus:outline-none focus:border-blue-600"
                />
                <button
                  onClick={handleAIChat}
                  disabled={!chatMessage.trim() || chatLoading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 disabled:opacity-50"
                >
                  שלח
                </button>
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
              <h2 className="text-2xl font-semibold">ניתוח הצעת מחיר</h2>
              <button
                onClick={() => setShowQuoteAnalysis(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {analyzing ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">AI מנתח את הצעת המחיר...</p>
                <p className="text-sm text-gray-500 mt-2">בודק מחירים, מזהה חוסרים, משווה לשוק</p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{quoteAnalysis}</div>
              </div>
            )}
            
            <button
              onClick={() => setShowQuoteAnalysis(false)}
              className="w-full mt-6 bg-gray-100 text-gray-700 py-3 rounded-full text-base font-medium hover:bg-gray-200 transition-colors"
            >
              סגור
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
