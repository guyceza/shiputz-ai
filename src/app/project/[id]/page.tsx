"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

// Check for admin mode from localStorage (set during login)
const getIsAdmin = () => {
  if (typeof window === 'undefined') return false;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.isAdmin === true;
  } catch {
    return false;
  }
};

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  imageUrl?: string;
}

interface CategoryBudget {
  category: string;
  allocated: number;
}

interface Phase {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed";
  order: number;
}

interface Task {
  id: string;
  phaseId: string;
  text: string;
  completed: boolean;
}

interface ProgressPhoto {
  id: string;
  imageUrl: string;
  date: string;
  description: string;
}

interface Supplier {
  id: string;
  name: string;
  phone: string;
  profession: string;
  rating: number;
  notes?: string;
}

interface SavedQuote {
  id: string;
  supplierName: string;
  description: string;
  amount: number;
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
  categoryBudgets?: CategoryBudget[];
  phases?: Phase[];
  tasks?: Task[];
  photos?: ProgressPhoto[];
  suppliers?: Supplier[];
  savedQuotes?: SavedQuote[];
}

const CATEGORIES = ["חומרי בניין", "עבודה", "חשמל", "אינסטלציה", "ריצוף", "צבע", "מטבח", "אמבטיה", "אחר"];

const DEFAULT_PHASES: Omit<Phase, "id">[] = [
  { name: "הריסה", status: "pending", order: 1 },
  { name: "שלד", status: "pending", order: 2 },
  { name: "חשמל", status: "pending", order: 3 },
  { name: "אינסטלציה", status: "pending", order: 4 },
  { name: "טיח וריצוף", status: "pending", order: 5 },
  { name: "גמר", status: "pending", order: 6 },
];

const PROFESSIONS = ["קבלן ראשי", "חשמלאי", "אינסטלטור", "רצף", "צבעי", "נגר", "מזגן", "גבס", "אלומיניום", "אחר"];

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quoteInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "suppliers" | "photos">("overview");
  
  // Expense modal
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // AI Chat
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Quote Analysis
  const [showQuoteAnalysis, setShowQuoteAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [quoteAnalysis, setQuoteAnalysis] = useState<string | null>(null);
  
  // Budget breakdown
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [tempBudgets, setTempBudgets] = useState<CategoryBudget[]>([]);
  
  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  
  // Photo modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoDescription, setPhotoDescription] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<ProgressPhoto | null>(null);
  
  // Supplier modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierProfession, setSupplierProfession] = useState(PROFESSIONS[0]);
  const [supplierRating, setSupplierRating] = useState(5);
  const [supplierNotes, setSupplierNotes] = useState("");
  
  // Quote save modal
  const [showSaveQuoteModal, setShowSaveQuoteModal] = useState(false);
  const [quoteSupplierName, setQuoteSupplierName] = useState("");
  const [quoteDescription, setQuoteDescription] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteImage, setQuoteImage] = useState<string | null>(null);
  
  // Quote comparison
  const [showQuoteComparison, setShowQuoteComparison] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  
  // Admin mode
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  
  useEffect(() => {
    setIsAdmin(getIsAdmin());
  }, []);
  
  // איך השיפוץ שלי יראה?
  const [showAIVision, setShowAIVision] = useState(false);
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [visionDescription, setVisionDescription] = useState("");
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionResult, setVisionResult] = useState<{
    analysis: string;
    generatedImage: string | null;
    costs: {
      items: { description: string; quantity: string; unitPrice: number; total: number }[];
      subtotal: number;
      labor: number;
      total: number;
      confidence: string;
    };
  } | null>(null);
  const visionInputRef = useRef<HTMLInputElement>(null);

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
        // Initialize phases if not present
        if (!found.phases || found.phases.length === 0) {
          found.phases = DEFAULT_PHASES.map((p, i) => ({ ...p, id: `phase-${i}` }));
        }
        setProject(found);
      } else {
        router.push("/dashboard");
      }
    }
  }, [params.id, router]);

  const saveProject = (updatedProject: Project) => {
    const savedProjects = localStorage.getItem("projects");
    if (savedProjects) {
      const projects: Project[] = JSON.parse(savedProjects);
      const updatedProjects = projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      localStorage.setItem("projects", JSON.stringify(updatedProjects));
    }
    setProject(updatedProject);
  };

  // Calculate expenses by category
  const getExpensesByCategory = () => {
    if (!project?.expenses) return {};
    return project.expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  // Check budget alerts
  const getBudgetAlerts = () => {
    if (!project?.categoryBudgets) return [];
    const expensesByCategory = getExpensesByCategory();
    return project.categoryBudgets.filter(cb => {
      const spent = expensesByCategory[cb.category] || 0;
      return spent > cb.allocated && cb.allocated > 0;
    }).map(cb => ({
      category: cb.category,
      allocated: cb.allocated,
      spent: expensesByCategory[cb.category] || 0,
      over: (expensesByCategory[cb.category] || 0) - cb.allocated
    }));
  };

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
      setQuoteImage(base64);
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedPhoto(reader.result as string);
      setShowPhotoModal(true);
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
    saveProject(updatedProject);
    setShowAddExpense(false);
    setDescription("");
    setAmount("");
    setCategory(CATEGORIES[0]);
    setSelectedImage(null);
  };

  const handleSaveBudgets = () => {
    if (!project) return;
    saveProject({ ...project, categoryBudgets: tempBudgets });
    setShowBudgetModal(false);
  };

  const openBudgetModal = () => {
    setTempBudgets(project?.categoryBudgets || CATEGORIES.map(cat => ({ category: cat, allocated: 0 })));
    setShowBudgetModal(true);
  };

  const updatePhaseStatus = (phaseId: string, status: Phase["status"]) => {
    if (!project?.phases) return;
    const updatedPhases = project.phases.map(p => 
      p.id === phaseId ? { ...p, status } : p
    );
    saveProject({ ...project, phases: updatedPhases });
  };

  const addTask = () => {
    if (!project || !selectedPhaseId || !newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      phaseId: selectedPhaseId,
      text: newTaskText.trim(),
      completed: false,
    };
    saveProject({ ...project, tasks: [...(project.tasks || []), newTask] });
    setNewTaskText("");
  };

  const toggleTask = (taskId: string) => {
    if (!project?.tasks) return;
    const updatedTasks = project.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    saveProject({ ...project, tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    if (!project?.tasks) return;
    saveProject({ ...project, tasks: project.tasks.filter(t => t.id !== taskId) });
  };

  const addPhoto = () => {
    if (!project || !selectedPhoto) return;
    const newPhoto: ProgressPhoto = {
      id: Date.now().toString(),
      imageUrl: selectedPhoto,
      date: new Date().toISOString(),
      description: photoDescription,
    };
    saveProject({ ...project, photos: [...(project.photos || []), newPhoto] });
    setShowPhotoModal(false);
    setSelectedPhoto(null);
    setPhotoDescription("");
  };

  const deletePhoto = (photoId: string) => {
    if (!project?.photos) return;
    saveProject({ ...project, photos: project.photos.filter(p => p.id !== photoId) });
    setViewPhoto(null);
  };

  const saveSupplier = () => {
    if (!project || !supplierName || !supplierPhone) return;
    if (editingSupplier) {
      const updatedSuppliers = (project.suppliers || []).map(s => 
        s.id === editingSupplier.id 
          ? { ...s, name: supplierName, phone: supplierPhone, profession: supplierProfession, rating: supplierRating, notes: supplierNotes }
          : s
      );
      saveProject({ ...project, suppliers: updatedSuppliers });
    } else {
      const newSupplier: Supplier = {
        id: Date.now().toString(),
        name: supplierName,
        phone: supplierPhone,
        profession: supplierProfession,
        rating: supplierRating,
        notes: supplierNotes,
      };
      saveProject({ ...project, suppliers: [...(project.suppliers || []), newSupplier] });
    }
    closeSupplierModal();
  };

  const deleteSupplier = (supplierId: string) => {
    if (!project?.suppliers) return;
    saveProject({ ...project, suppliers: project.suppliers.filter(s => s.id !== supplierId) });
  };

  const openEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierName(supplier.name);
    setSupplierPhone(supplier.phone);
    setSupplierProfession(supplier.profession);
    setSupplierRating(supplier.rating);
    setSupplierNotes(supplier.notes || "");
    setShowSupplierModal(true);
  };

  const closeSupplierModal = () => {
    setShowSupplierModal(false);
    setEditingSupplier(null);
    setSupplierName("");
    setSupplierPhone("");
    setSupplierProfession(PROFESSIONS[0]);
    setSupplierRating(5);
    setSupplierNotes("");
  };

  const saveQuote = () => {
    if (!project || !quoteSupplierName || !quoteAmount) return;
    const newQuote: SavedQuote = {
      id: Date.now().toString(),
      supplierName: quoteSupplierName,
      description: quoteDescription,
      amount: parseFloat(quoteAmount),
      date: new Date().toISOString(),
      imageUrl: quoteImage || undefined,
    };
    saveProject({ ...project, savedQuotes: [...(project.savedQuotes || []), newQuote] });
    setShowSaveQuoteModal(false);
    setQuoteSupplierName("");
    setQuoteDescription("");
    setQuoteAmount("");
    setQuoteImage(null);
  };

  const deleteQuote = (quoteId: string) => {
    if (!project?.savedQuotes) return;
    saveProject({ ...project, savedQuotes: project.savedQuotes.filter(q => q.id !== quoteId) });
    setSelectedQuotes(prev => prev.filter(id => id !== quoteId));
  };

  const toggleQuoteSelection = (quoteId: string) => {
    setSelectedQuotes(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  // Export functions
  const exportToPDF = () => {
    window.print();
  };

  const exportToCSV = () => {
    if (!project) return;
    
    let csv = "תיאור,סכום,קטגוריה,תאריך\n";
    (project.expenses || []).forEach(exp => {
      csv += `"${exp.description}",${exp.amount},"${exp.category}","${new Date(exp.date).toLocaleDateString("he-IL")}"\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name}-expenses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // איך השיפוץ שלי יראה? handlers
  const getVisionUsageToday = (): number => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('aiVisionUsage');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        return data.count;
      }
    }
    return 0;
  };

  const incrementVisionUsage = () => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('aiVisionUsage');
    let count = 1;
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        count = data.count + 1;
      }
    }
    localStorage.setItem('aiVisionUsage', JSON.stringify({ date: today, count }));
  };

  const handleVisionImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setVisionImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleVisionGenerate = async () => {
    if (!visionImage || !visionDescription.trim()) return;
    
    const usage = getVisionUsageToday();
    if (usage >= 10 && !isAdmin) {
      setShowLimitModal(true);
      return;
    }
    
    setVisionLoading(true);
    setVisionResult(null);
    
    try {
      const response = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: visionImage,
          description: visionDescription
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setVisionResult({
          analysis: data.analysis,
          generatedImage: data.generatedImage,
          costs: data.costs
        });
        incrementVisionUsage();
      } else {
        alert('שגיאה ביצירת ההדמיה. נסה שוב.');
      }
    } catch {
      alert('שגיאה בתקשורת. נסה שוב.');
    }
    
    setVisionLoading(false);
  };

  const resetVision = () => {
    setVisionImage(null);
    setVisionDescription("");
    setVisionResult(null);
  };

  const exportFullReport = () => {
    if (!project) return;
    
    let csv = "דוח פרויקט שיפוץ\n\n";
    csv += `שם הפרויקט,${project.name}\n`;
    csv += `תקציב,${project.budget}\n`;
    csv += `הוצאות,${project.spent}\n`;
    csv += `נותר,${project.budget - project.spent}\n\n`;
    
    csv += "הוצאות לפי קטגוריה\n";
    csv += "קטגוריה,תקציב מוקצה,הוצאות בפועל,הפרש\n";
    const expByCategory = getExpensesByCategory();
    CATEGORIES.forEach(cat => {
      const allocated = project.categoryBudgets?.find(cb => cb.category === cat)?.allocated || 0;
      const spent = expByCategory[cat] || 0;
      csv += `"${cat}",${allocated},${spent},${allocated - spent}\n`;
    });
    
    csv += "\nרשימת הוצאות\n";
    csv += "תיאור,סכום,קטגוריה,תאריך\n";
    (project.expenses || []).forEach(exp => {
      csv += `"${exp.description}",${exp.amount},"${exp.category}","${new Date(exp.date).toLocaleDateString("he-IL")}"\n`;
    });
    
    csv += "\nספקים\n";
    csv += "שם,טלפון,מקצוע,דירוג\n";
    (project.suppliers || []).forEach(sup => {
      csv += `"${sup.name}","${sup.phone}","${sup.profession}",${sup.rating}\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name}-full-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!project) return null;

  const budgetPercentage = (project.spent / project.budget) * 100;
  const remaining = project.budget - project.spent;
  const expensesByCategory = getExpensesByCategory();
  const budgetAlerts = getBudgetAlerts();
  const maxCategoryExpense = Math.max(...Object.values(expensesByCategory), 1);

  // Star rating component
  const StarRating = ({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          className={`text-xl ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
          disabled={readonly}
        >
          {star <= rating ? "★" : "☆"}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Navigation */}
      <nav className="h-11 border-b border-gray-100 print:hidden">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">‹ חזרה</Link>
            <span className="text-base font-semibold text-gray-900">{project.name}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={exportToPDF} className="text-sm text-gray-500 hover:text-gray-900 px-3 py-1 border border-gray-200 rounded-lg">
              PDF ייצוא
            </button>
            <button onClick={exportFullReport} className="text-sm text-gray-500 hover:text-gray-900 px-3 py-1 border border-gray-200 rounded-lg">
              Excel ייצוא
            </button>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="border-b border-gray-100 print:hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: "overview", label: "סקירה" },
              { id: "timeline", label: "ציר זמן" },
              { id: "suppliers", label: "ספקים" },
              { id: "photos", label: "תמונות" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? "border-gray-900 text-gray-900" 
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
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
                <p className={`text-3xl font-semibold ${remaining < 0 ? "text-red-600" : "text-gray-900"}`}>
                  ₪{remaining.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>התקדמות</span>
                <span>{budgetPercentage.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${budgetPercentage > 100 ? "bg-red-500" : "bg-gray-900"}`} 
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }} 
                />
              </div>
            </div>

            {/* Budget Alerts */}
            {budgetAlerts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                <p className="font-semibold text-red-800 mb-3">⚠️ התראות חריגה מתקציב</p>
                <div className="space-y-2">
                  {budgetAlerts.map(alert => (
                    <p key={alert.category} className="text-sm text-red-700">
                      {alert.category}: חריגה של ₪{alert.over.toLocaleString()} (הוקצה ₪{alert.allocated.toLocaleString()}, הוצאו ₪{alert.spent.toLocaleString()})
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* General Alert */}
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

            {/* Category Budget Chart */}
            <div className="border border-gray-100 rounded-2xl p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">הוצאות לפי קטגוריה</h2>
                <button
                  onClick={openBudgetModal}
                  className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-full"
                >
                  הגדר תקציב לקטגוריות
                </button>
              </div>
              
              {Object.keys(expensesByCategory).length === 0 ? (
                <p className="text-gray-500 text-center py-8">אין הוצאות עדיין</p>
              ) : (
                <div className="space-y-4">
                  {CATEGORIES.filter(cat => expensesByCategory[cat] || project.categoryBudgets?.find(cb => cb.category === cat)?.allocated).map(cat => {
                    const spent = expensesByCategory[cat] || 0;
                    const allocated = project.categoryBudgets?.find(cb => cb.category === cat)?.allocated || 0;
                    const barWidth = (spent / (allocated || maxCategoryExpense)) * 100;
                    const isOver = allocated > 0 && spent > allocated;
                    
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{cat}</span>
                          <span className={isOver ? "text-red-600 font-medium" : "text-gray-500"}>
                            ₪{spent.toLocaleString()}
                            {allocated > 0 && ` / ₪${allocated.toLocaleString()}`}
                          </span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : "bg-gray-700"}`}
                            style={{ width: `${Math.min(barWidth, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* איך השיפוץ שלי יראה? */}
            <div className="border border-gray-100 rounded-2xl p-8 mb-8 print:hidden bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">איך השיפוץ שלי יראה?</h2>
                    <p className="text-sm text-gray-500">ראה את השיפוץ לפני שמתחיל</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  נשארו לך <span className="font-semibold text-gray-900">{10 - getVisionUsageToday()}</span> עריכות היום
                </div>
              </div>
              <button
                onClick={() => setShowAIVision(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                צור הדמיה חדשה
              </button>
            </div>

            {/* AI Tools */}
            <div className="border border-gray-100 rounded-2xl p-8 mb-8 print:hidden">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">כלי AI</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => quoteInputRef.current?.click()}
                  className="text-right bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:bg-gray-100 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] active:bg-gray-100 transition-all"
                >
                  <input ref={quoteInputRef} type="file" accept="image/*" onChange={handleQuoteUpload} className="hidden" />
                  <p className="font-medium text-gray-900 mb-1">ניתוח הצעת מחיר</p>
                  <p className="text-sm text-gray-500">העלה הצעה לניתוח</p>
                </button>
                <button
                  onClick={() => setShowAIChat(true)}
                  className="text-right bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:bg-gray-100 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] active:bg-gray-100 transition-all"
                >
                  <p className="font-medium text-gray-900 mb-1">עוזר AI</p>
                  <p className="text-sm text-gray-500">שאל שאלות על השיפוץ</p>
                </button>
                <button
                  onClick={() => { fileInputRef.current?.click(); setShowAddExpense(true); }}
                  className="text-right bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:bg-gray-100 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] active:bg-gray-100 transition-all"
                >
                  <p className="font-medium text-gray-900 mb-1">סריקת קבלה</p>
                  <p className="text-sm text-gray-500">צלם והוסף אוטומטית</p>
                </button>
              </div>
            </div>

            {/* Expenses */}
            <div className="border border-gray-100 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">הוצאות</h2>
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={exportToCSV}
                    className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-full"
                  >
                    ייצוא CSV
                  </button>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm hover:bg-gray-800"
                  >
                    הוסף הוצאה
                  </button>
                </div>
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
                          <img src={expense.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg print:hidden" />
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
          </>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">שלבי הפרויקט</h2>
            </div>
            
            <div className="space-y-4">
              {(project.phases || []).sort((a, b) => a.order - b.order).map((phase, index) => {
                const phaseTasks = (project.tasks || []).filter(t => t.phaseId === phase.id);
                const completedTasks = phaseTasks.filter(t => t.completed).length;
                
                return (
                  <div key={phase.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="p-6 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            phase.status === "completed" ? "bg-green-500" :
                            phase.status === "in-progress" ? "bg-blue-500" : "bg-gray-300"
                          }`}>
                            {phase.status === "completed" ? "✓" : index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{phase.name}</p>
                            {phaseTasks.length > 0 && (
                              <p className="text-sm text-gray-500">{completedTasks}/{phaseTasks.length} משימות הושלמו</p>
                            )}
                          </div>
                        </div>
                        <select
                          value={phase.status}
                          onChange={(e) => updatePhaseStatus(phase.id, e.target.value as Phase["status"])}
                          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                        >
                          <option value="pending">ממתין</option>
                          <option value="in-progress">בביצוע</option>
                          <option value="completed">הושלם</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Tasks */}
                    <div className="p-6 bg-white">
                      {phaseTasks.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {phaseTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between group">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => toggleTask(task.id)}
                                  className="w-5 h-5 rounded border-gray-300"
                                />
                                <span className={task.completed ? "text-gray-400 line-through" : "text-gray-700"}>
                                  {task.text}
                                </span>
                              </label>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => { setSelectedPhaseId(phase.id); setShowTaskModal(true); }}
                        className="text-sm text-gray-500 hover:text-gray-900"
                      >
                        + הוסף משימה
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Suppliers Tab */}
        {activeTab === "suppliers" && (
          <div className="space-y-8">
            {/* Suppliers List */}
            <div className="border border-gray-100 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">ספקים וקבלנים</h2>
                <button
                  onClick={() => setShowSupplierModal(true)}
                  className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm hover:bg-gray-800"
                >
                  הוסף ספק
                </button>
              </div>

              {!project.suppliers || project.suppliers.length === 0 ? (
                <p className="text-gray-500 text-center py-12">אין ספקים עדיין</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {project.suppliers.map(supplier => (
                    <div key={supplier.id} className="border border-gray-100 rounded-xl p-5 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{supplier.name}</p>
                          <p className="text-sm text-gray-500">{supplier.profession}</p>
                          <a href={`tel:${supplier.phone}`} className="text-sm text-blue-600 hover:underline">
                            {supplier.phone}
                          </a>
                          <div className="mt-2">
                            <StarRating rating={supplier.rating} readonly />
                          </div>
                          {supplier.notes && (
                            <p className="text-sm text-gray-500 mt-2">{supplier.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditSupplier(supplier)}
                            className="text-gray-400 hover:text-gray-900"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => deleteSupplier(supplier.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Quotes */}
            <div className="border border-gray-100 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">הצעות מחיר שמורות</h2>
                <div className="flex gap-2">
                  {selectedQuotes.length >= 2 && (
                    <button
                      onClick={() => setShowQuoteComparison(true)}
                      className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-full"
                    >
                      השווה ({selectedQuotes.length})
                    </button>
                  )}
                  <button
                    onClick={() => setShowSaveQuoteModal(true)}
                    className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm hover:bg-gray-800"
                  >
                    הוסף הצעה
                  </button>
                </div>
              </div>

              {!project.savedQuotes || project.savedQuotes.length === 0 ? (
                <p className="text-gray-500 text-center py-12">אין הצעות מחיר שמורות</p>
              ) : (
                <div className="space-y-3">
                  {project.savedQuotes.map(quote => (
                    <div 
                      key={quote.id} 
                      className={`border rounded-xl p-5 transition-colors cursor-pointer ${
                        selectedQuotes.includes(quote.id) 
                          ? "border-gray-900 bg-gray-50" 
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                      onClick={() => toggleQuoteSelection(quote.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedQuotes.includes(quote.id)}
                            onChange={() => {}}
                            className="w-5 h-5 rounded border-gray-300"
                          />
                          {quote.imageUrl && (
                            <img src={quote.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{quote.supplierName}</p>
                            <p className="text-sm text-gray-500">{quote.description}</p>
                            <p className="text-xs text-gray-400">{new Date(quote.date).toLocaleDateString("he-IL")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-semibold text-gray-900">₪{quote.amount.toLocaleString()}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteQuote(quote.id); }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === "photos" && (
          <div className="border border-gray-100 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">גלריית התקדמות</h2>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm hover:bg-gray-800"
              >
                הוסף תמונה
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>

            {!project.photos || project.photos.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">אין תמונות עדיין</p>
                <p className="text-sm text-gray-400">תעד את התקדמות השיפוץ בתמונות</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {project.photos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(photo => (
                  <div 
                    key={photo.id} 
                    className="relative group cursor-pointer"
                    onClick={() => setViewPhoto(photo)}
                  >
                    <img 
                      src={photo.imageUrl} 
                      alt={photo.description} 
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-xl" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent rounded-b-xl">
                      <p className="text-white text-xs">{new Date(photo.date).toLocaleDateString("he-IL")}</p>
                      {photo.description && <p className="text-white text-sm truncate">{photo.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

      {/* Budget Allocation Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">הקצאת תקציב לקטגוריות</h2>
            <p className="text-sm text-gray-500 mb-6">
              תקציב כולל: ₪{project.budget.toLocaleString()} | 
              מוקצה: ₪{tempBudgets.reduce((sum, cb) => sum + cb.allocated, 0).toLocaleString()}
            </p>
            
            <div className="space-y-4">
              {tempBudgets.map((cb, index) => (
                <div key={cb.category} className="flex items-center gap-4">
                  <span className="text-gray-700 w-24">{cb.category}</span>
                  <input
                    type="number"
                    value={cb.allocated || ""}
                    onChange={(e) => {
                      const updated = [...tempBudgets];
                      updated[index] = { ...cb, allocated: parseFloat(e.target.value) || 0 };
                      setTempBudgets(updated);
                    }}
                    placeholder="0"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
                  />
                  <span className="text-gray-400 text-sm">₪</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={handleSaveBudgets} className="flex-1 bg-gray-900 text-white py-3 rounded-full hover:bg-gray-800">שמור</button>
              <button onClick={() => setShowBudgetModal(false)} className="flex-1 border border-gray-200 text-gray-900 py-3 rounded-full hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">הוסף משימה</h2>
            
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="תיאור המשימה..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 mb-6"
              autoFocus
            />

            <div className="flex gap-3">
              <button onClick={() => { addTask(); setShowTaskModal(false); }} disabled={!newTaskText.trim()} className="flex-1 bg-gray-900 text-white py-3 rounded-full hover:bg-gray-800 disabled:opacity-30">הוסף</button>
              <button onClick={() => { setShowTaskModal(false); setNewTaskText(""); }} className="flex-1 border border-gray-200 text-gray-900 py-3 rounded-full hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">הוסף תמונה</h2>
            
            {selectedPhoto && (
              <img src={selectedPhoto} alt="" className="w-full h-48 object-cover rounded-xl mb-6" />
            )}
            
            <input
              type="text"
              value={photoDescription}
              onChange={(e) => setPhotoDescription(e.target.value)}
              placeholder="תיאור (אופציונלי)..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 mb-6"
            />

            <div className="flex gap-3">
              <button onClick={addPhoto} className="flex-1 bg-gray-900 text-white py-3 rounded-full hover:bg-gray-800">שמור</button>
              <button onClick={() => { setShowPhotoModal(false); setSelectedPhoto(null); setPhotoDescription(""); }} className="flex-1 border border-gray-200 text-gray-900 py-3 rounded-full hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* View Photo Modal */}
      {viewPhoto && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-50" onClick={() => setViewPhoto(null)}>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={viewPhoto.imageUrl} alt={viewPhoto.description} className="w-full max-h-[70vh] object-contain rounded-xl" />
            <div className="mt-4 text-white text-center">
              <p className="text-lg">{viewPhoto.description || "ללא תיאור"}</p>
              <p className="text-sm text-gray-400">{new Date(viewPhoto.date).toLocaleDateString("he-IL")}</p>
              <button
                onClick={() => deletePhoto(viewPhoto.id)}
                className="mt-4 text-red-400 hover:text-red-300"
              >
                מחק תמונה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingSupplier ? "ערוך ספק" : "הוסף ספק"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-2">שם</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="שם הספק או הקבלן"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">טלפון</label>
                <input
                  type="tel"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="050-0000000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">מקצוע</label>
                <select
                  value={supplierProfession}
                  onChange={(e) => setSupplierProfession(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 bg-white"
                >
                  {PROFESSIONS.map(prof => <option key={prof} value={prof}>{prof}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">דירוג</label>
                <StarRating rating={supplierRating} onChange={setSupplierRating} />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">הערות</label>
                <textarea
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  placeholder="הערות נוספות..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={saveSupplier} disabled={!supplierName || !supplierPhone} className="flex-1 bg-gray-900 text-white py-3 rounded-full hover:bg-gray-800 disabled:opacity-30">
                {editingSupplier ? "עדכן" : "הוסף"}
              </button>
              <button onClick={closeSupplierModal} className="flex-1 border border-gray-200 text-gray-900 py-3 rounded-full hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* Save Quote Modal */}
      {showSaveQuoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">שמור הצעת מחיר</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-2">שם הספק</label>
                <input
                  type="text"
                  value={quoteSupplierName}
                  onChange={(e) => setQuoteSupplierName(e.target.value)}
                  placeholder="מאיפה ההצעה?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">תיאור</label>
                <input
                  type="text"
                  value={quoteDescription}
                  onChange={(e) => setQuoteDescription(e.target.value)}
                  placeholder="למה ההצעה? (למשל: עבודות חשמל)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">סכום (₪)</label>
                <input
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={saveQuote} disabled={!quoteSupplierName || !quoteAmount} className="flex-1 bg-gray-900 text-white py-3 rounded-full hover:bg-gray-800 disabled:opacity-30">שמור</button>
              <button onClick={() => { setShowSaveQuoteModal(false); setQuoteSupplierName(""); setQuoteDescription(""); setQuoteAmount(""); }} className="flex-1 border border-gray-200 text-gray-900 py-3 rounded-full hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Comparison Modal */}
      {showQuoteComparison && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">השוואת הצעות מחיר</h2>
              <button onClick={() => setShowQuoteComparison(false)} className="text-gray-500 hover:text-gray-900">✕</button>
            </div>
            
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedQuotes.length}, 1fr)` }}>
              {selectedQuotes.map(quoteId => {
                const quote = project.savedQuotes?.find(q => q.id === quoteId);
                if (!quote) return null;
                
                const isLowest = project.savedQuotes
                  ?.filter(q => selectedQuotes.includes(q.id))
                  .every(q => quote.amount <= q.amount);
                
                return (
                  <div key={quote.id} className={`border rounded-xl p-6 ${isLowest ? "border-green-500 bg-green-50" : "border-gray-100"}`}>
                    {isLowest && <p className="text-green-600 text-sm font-medium mb-2">✓ הזול ביותר</p>}
                    <p className="font-semibold text-gray-900 text-lg">{quote.supplierName}</p>
                    <p className="text-gray-500 text-sm mt-1">{quote.description}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-4">₪{quote.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(quote.date).toLocaleDateString("he-IL")}</p>
                    {quote.imageUrl && (
                      <img src={quote.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg mt-4" />
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={() => setShowQuoteComparison(false)} className="w-full mt-6 border border-gray-200 text-gray-900 py-3 rounded-full hover:bg-gray-50">סגור</button>
          </div>
        </div>
      )}

      {/* איך השיפוץ שלי יראה? Modal */}
      {showAIVision && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <h2 className="text-lg font-semibold text-gray-900">איך השיפוץ שלי יראה? - הדמיית שיפוץ</h2>
              </div>
              <button onClick={() => { setShowAIVision(false); resetVision(); }} className="text-gray-500 hover:text-gray-900">✕</button>
            </div>
            
            <div className="p-6">
              <input ref={visionInputRef} type="file" accept="image/*" onChange={handleVisionImageSelect} className="hidden" />
              
              {!visionResult ? (
                <div className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">1. העלה תמונה של החדר</label>
                    {visionImage ? (
                      <div className="relative">
                        <img src={visionImage} alt="Selected room" className="w-full h-64 object-cover rounded-xl" />
                        <button 
                          onClick={() => setVisionImage(null)}
                          className="absolute top-3 left-3 bg-black/50 text-white w-8 h-8 rounded-full hover:bg-black/70"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => visionInputRef.current?.click()}
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
                      >
                        <span className="text-4xl mb-2">📷</span>
                        <span>לחץ להעלאת תמונה</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">2. תאר את השינויים שאתה רוצה</label>
                    <textarea
                      value={visionDescription}
                      onChange={(e) => setVisionDescription(e.target.value)}
                      placeholder="לדוגמה: רוצה להחליף את הריצוף לפרקט עץ, להוסיף תאורה שקועה בתקרה, ולצבוע את הקירות באפור כהה..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                  
                  {/* Generate Button */}
                  <button
                    onClick={handleVisionGenerate}
                    disabled={!visionImage || !visionDescription.trim() || visionLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {visionLoading ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        יוצר הדמיה...
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        תן לי לראות
                      </>
                    )}
                  </button>
                  
                  {visionLoading && (
                    <div className="text-center text-sm text-gray-500">
                      <p>מנתח את התמונה ויוצר הדמיה...</p>
                      <p>זה יכול לקחת עד 30 שניות</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Before/After Comparison */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2 text-center">לפני</p>
                      <img src={visionImage!} alt="Before" className="w-full h-64 object-cover rounded-xl border border-gray-200" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2 text-center">אחרי (הדמיה)</p>
                      {visionResult.generatedImage ? (
                        <img src={visionResult.generatedImage} alt="After" className="w-full h-64 object-cover rounded-xl border-2 border-purple-300" />
                      ) : (
                        <div className="w-full h-64 rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                          <div className="text-center p-4">
                            <span className="text-4xl mb-2 block">🎨</span>
                            <p className="text-purple-700 font-medium">ההדמיה מבוססת על הניתוח</p>
                            <p className="text-purple-600 text-sm">ראה פירוט למטה</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Analysis */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">ניתוח AI</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{visionResult.analysis}</p>
                  </div>
                  
                  {/* Cost Breakdown */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">הערכת עלויות</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        רמת ביטחון: {visionResult.costs.confidence}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      {visionResult.costs.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="text-gray-900">{item.description}</span>
                            <span className="text-gray-400 mr-2">({item.quantity})</span>
                          </div>
                          <span className="text-gray-700">₪{item.total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">סה״כ חומרים</span>
                        <span className="text-gray-700">₪{visionResult.costs.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">עבודה (25%)</span>
                        <span className="text-gray-700">₪{visionResult.costs.labor.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                        <span className="text-gray-900">סה״כ משוער</span>
                        <span className="text-purple-600">₪{visionResult.costs.total.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-4 text-center">
                      * ההערכה מבוססת על מחירי שוק ממוצעים. המחיר הסופי תלוי בספקים, חומרים ואזור
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={resetVision}
                      className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
                    >
                      צור הדמיה חדשה
                    </button>
                    <button
                      onClick={() => setShowAIVision(false)}
                      className="flex-1 border border-gray-200 text-gray-900 py-3 rounded-xl hover:bg-gray-50"
                    >
                      סגור
                    </button>
                  </div>
                </div>
              )}
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
              <>
                <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed mb-6">{quoteAnalysis}</div>
                <button
                  onClick={() => { setShowQuoteAnalysis(false); setShowSaveQuoteModal(true); }}
                  className="w-full bg-gray-900 text-white py-3 rounded-full hover:bg-gray-800 mb-3"
                >
                  שמור הצעה להשוואה
                </button>
              </>
            )}
            <button onClick={() => setShowQuoteAnalysis(false)} className="w-full border border-gray-200 text-gray-900 py-3 rounded-full hover:bg-gray-50">סגור</button>
          </div>
        </div>
      )}

      {/* Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎨</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">נגמרו ההדמיות להיום</h3>
            <p className="text-gray-500 mb-6">
              השתמשת ב-10 ההדמיות היומיות שלך. רוצה להמשיך לדמיין את השיפוץ?
            </p>
            
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 mb-6">
              <div className="text-3xl font-bold text-gray-900 mb-1">₪29.90</div>
              <div className="text-sm text-gray-500 mb-4">עבור 20 הדמיות נוספות</div>
              <ul className="text-sm text-gray-600 space-y-2 text-right">
                <li className="flex items-center gap-2 justify-end">
                  <span>הדמיות באיכות גבוהה</span>
                  <span className="text-green-500">✓</span>
                </li>
                <li className="flex items-center gap-2 justify-end">
                  <span>הערכת עלויות מדויקת</span>
                  <span className="text-green-500">✓</span>
                </li>
                <li className="flex items-center gap-2 justify-end">
                  <span>תקף ל-30 יום</span>
                  <span className="text-green-500">✓</span>
                </li>
              </ul>
            </div>
            
            <button
              onClick={() => window.location.href = '/signup?plan=vision-pack'}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-full font-medium hover:from-purple-700 hover:to-blue-700 transition-all mb-3"
            >
              רכוש עכשיו
            </button>
            <button
              onClick={() => setShowLimitModal(false)}
              className="w-full text-gray-500 py-2 hover:text-gray-700"
            >
              אנסה שוב מחר
            </button>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background: white !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
