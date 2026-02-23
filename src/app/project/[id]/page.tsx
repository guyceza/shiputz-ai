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

interface ExpenseItem {
  name: string;
  quantity?: number;
  price?: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string; // תאריך הוספה
  invoiceDate?: string; // תאריך חשבונית (מהסריקה)
  imageUrl?: string;
  vendor?: string;
  items?: ExpenseItem[];
  fullText?: string;
  vatIncluded?: boolean;
  vatAmount?: number;
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

const SCAN_TIPS = [
  "💡 טיפ: שמור על כל הקבלות במקום אחד",
  "💡 טיפ: צלם קבלות מיד אחרי קבלתן",
  "💡 טיפ: בדוק שהסכום בקבלה תואם למה שסוכם",
  "💡 טיפ: בקש חשבונית מס אם אתה עוסק",
  "💡 טיפ: השווה מחירים בין ספקים שונים",
  "💡 טיפ: תכנן מראש 10-15% תקציב לבלת״מים",
];

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
  // const quoteInputRef = useRef<HTMLInputElement>(null); // Removed - using text input now
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "suppliers" | "photos">("overview");
  
  // Expense modal
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [multiScanQueue, setMultiScanQueue] = useState<string[]>([]); // Queue of base64 images
  const [multiScanIndex, setMultiScanIndex] = useState(0); // Current processing index
  const [multiScanResults, setMultiScanResults] = useState<Array<{image: string, data: any}>>([]);
  const [showMultiScanSuccess, setShowMultiScanSuccess] = useState(false);
  const [multiScanSuccessMessage, setMultiScanSuccessMessage] = useState<{count: number, totalAmount: number, items: Array<{description: string, amount: number, vendor?: string}>} | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Expense details modal
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  // Additional receipt scan data
  const [scannedVendor, setScannedVendor] = useState<string>("");
  const [scannedItems, setScannedItems] = useState<ExpenseItem[]>([]);
  const [scannedFullText, setScannedFullText] = useState<string>("");
  const [scannedVatAmount, setScannedVatAmount] = useState<number | null>(null);
  const [scannedDate, setScannedDate] = useState<string>("");
  const [scanTimer, setScanTimer] = useState<number>(0);
  const [scanTip, setScanTip] = useState<string>("");
  const [editingExpense, setEditingExpense] = useState(false);
  const [editExpenseData, setEditExpenseData] = useState<Partial<Expense>>({});
  const [expenseSort, setExpenseSort] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [expenseFilter, setExpenseFilter] = useState<string>('all');
  
  // AI Chat
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  
  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Quote Analysis
  const [showQuoteAnalysis, setShowQuoteAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [quoteAnalysis, setQuoteAnalysis] = useState<string | null>(null);
  const [quoteText, setQuoteText] = useState("");
  
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [countdown, setCountdown] = useState(60);
  const [visionError, setVisionError] = useState<string | null>(null);
  const [showVisionHistory, setShowVisionHistory] = useState(false);
  
  // Vision history type
  interface VisionHistoryItem {
    id: string;
    date: string;
    beforeImage: string;
    afterImage: string;
    description: string;
    analysis: string;
    costs: { total: number; items?: { description: string; total: number }[] };
  }
  const [visionHistory, setVisionHistory] = useState<VisionHistoryItem[]>([]);
  const [selectedVisionItem, setSelectedVisionItem] = useState<VisionHistoryItem | null>(null);
  
  // Product search from image
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchImage, setProductSearchImage] = useState<string | null>(null);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [detectedProducts, setDetectedProducts] = useState<{name: string; description: string; searchQuery: string}[]>([]);
  
  // Tips to show during loading (no emojis)
  const loadingTips = [
    "טיפ: קבל לפחות 3 הצעות מחיר לפני שמתחילים",
    "טיפ: תעד הכל בכתב - זה יחסוך לך כאבי ראש",
    "טיפ: בדוק המלצות על קבלנים לפני שסוגרים",
    "טיפ: השאר 15% מהתקציב לבלת\"מים",
    "טיפ: שיפוץ תמיד לוקח יותר זמן מהצפוי",
    "טיפ: צלם את המצב הקיים לפני שמתחילים",
    "טיפ: החשמל והאינסטלציה - לא חוסכים עליהם",
    "טיפ: בחר צבעים ניטרליים - קל לשנות אחר כך",
    "טיפ: הזמן חומרים מראש - יש עיכובים באספקה",
    "טיפ: בדוק שהקבלן מבוטח ורשום",
  ];
  
  // Rotate tips and countdown during loading
  useEffect(() => {
    if (visionLoading) {
      setCountdown(60);
      setCurrentTipIndex(0);
      
      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
      
      // Rotate tips every 3 seconds
      const tipInterval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % loadingTips.length);
      }, 3000);
      
      return () => {
        clearInterval(countdownInterval);
        clearInterval(tipInterval);
      };
    }
  }, [visionLoading]);

  useEffect(() => {
    const loadData = () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.push("/login");
        return;
      }
      
      const user = JSON.parse(userData);
      const userId = user.id;

      const savedProjects = localStorage.getItem(userId ? `projects_${userId}` : "projects");
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
          return;
        }
      }
      
      // Load vision history for this project
      const savedHistory = localStorage.getItem(`visionHistory-${params.id}`);
      if (savedHistory) {
        setVisionHistory(JSON.parse(savedHistory));
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [params.id, router]);

  const saveProject = (updatedProject: Project) => {
    const userData = localStorage.getItem("user");
    const userId = userData ? JSON.parse(userData).id : null;
    const storageKey = userId ? `projects_${userId}` : "projects";
    
    const savedProjects = localStorage.getItem(storageKey);
    if (savedProjects) {
      const projects: Project[] = JSON.parse(savedProjects);
      const updatedProjects = projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      localStorage.setItem(storageKey, JSON.stringify(updatedProjects));
    }
    setProject(updatedProject);
  };

  const deleteExpense = (expenseId: string) => {
    if (!project || !confirm("האם למחוק את ההוצאה?")) return;
    const expenseToDelete = project.expenses?.find(e => e.id === expenseId);
    if (!expenseToDelete) return;
    const updatedProject = {
      ...project,
      expenses: project.expenses?.filter(e => e.id !== expenseId) || [],
      spent: project.spent - expenseToDelete.amount,
    };
    saveProject(updatedProject);
    setSelectedExpense(null);
  };

  const saveEditedExpense = () => {
    if (!project || !selectedExpense || !editExpenseData.description || !editExpenseData.amount) return;
    const oldAmount = selectedExpense.amount;
    const newAmount = editExpenseData.amount;
    const updatedExpense = { ...selectedExpense, ...editExpenseData };
    const updatedProject = {
      ...project,
      expenses: project.expenses?.map(e => e.id === selectedExpense.id ? updatedExpense : e) || [],
      spent: project.spent - oldAmount + newAmount,
    };
    saveProject(updatedProject);
    setSelectedExpense(updatedExpense);
    setEditingExpense(false);
  };

  // Get filtered and sorted expenses
  const getFilteredExpenses = () => {
    if (!project?.expenses) return [];
    let filtered = [...project.expenses];
    
    // Filter by category
    if (expenseFilter !== 'all') {
      filtered = filtered.filter(e => e.category === expenseFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (expenseSort) {
        case 'date-desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc': return b.amount - a.amount;
        case 'amount-asc': return a.amount - b.amount;
        default: return 0;
      }
    });
    
    return filtered;
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

  /**
   * Multi-Receipt Scan Feature (added 2026-02-23)
   * =============================================
   * Allows scanning up to 3 receipts at once.
   * 
   * Flow:
   * 1. User selects up to 3 images via file input (multiple attribute)
   * 2. handleImageSelect converts all to base64 BEFORE resetting input
   * 3. processMultiScan processes them one by one (sequential, not parallel)
   * 4. Each expense is saved to localStorage immediately
   * 5. Nice success modal shows all added expenses
   * 
   * Important:
   * - Uses local variable (currentProject) to track state between iterations
   *   because React setState is async and would cause stale data
   * - Saves to localStorage after EACH scan, not just at the end
   * - Timer shows "30 שניות לכל קבלה"
   * 
   * DO NOT CHANGE without testing thoroughly!
   */
  const processMultiScan = async (images: string[], startIndex: number) => {
    console.log("processMultiScan called with", images.length, "images, starting at", startIndex);
    const userData = localStorage.getItem("user");
    const userEmail = userData ? JSON.parse(userData).email : null;
    const currentUserId = userData ? JSON.parse(userData).id : null;
    console.log("userEmail:", userEmail);
    
    // Keep track of current project state locally (React state is async)
    let currentProject = project;
    const successfulScans: Array<{description: string, amount: number, vendor?: string}> = [];
    
    for (let i = startIndex; i < images.length; i++) {
      console.log("Processing image", i + 1, "of", images.length);
      setMultiScanIndex(i);
      setSelectedImage(images[i]);
      setScanning(true);
      setScanTimer(30);
      setScanTip(SCAN_TIPS[Math.floor(Math.random() * SCAN_TIPS.length)]);
      
      try {
        const response = await fetch("/api/scan-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: images[i], userEmail }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Scan result for image", i + 1, ":", data);
          
          if (!data.error && currentProject && data.description && data.amount) {
            const newExpense: Expense = {
              id: Date.now().toString() + '_' + i,
              description: data.description,
              amount: data.amount,
              category: CATEGORIES.includes(data.category) ? data.category : "אחר",
              date: new Date().toISOString(),
              imageUrl: images[i],
              vendor: data.vendor || undefined,
              items: data.items || undefined,
              fullText: data.fullText || undefined,
              vatAmount: data.vatAmount || undefined,
              invoiceDate: data.date || undefined,
            };
            
            // Update local project reference
            currentProject = {
              ...currentProject,
              expenses: [...(currentProject.expenses || []), newExpense],
              spent: currentProject.spent + data.amount,
            };
            
            // Save to localStorage immediately
            const storageKey = currentUserId ? `projects_${currentUserId}` : "projects";
            const savedProjects = localStorage.getItem(storageKey);
            if (savedProjects) {
              const projects = JSON.parse(savedProjects);
              const updated = projects.map((p: Project) => p.id === currentProject!.id ? currentProject : p);
              localStorage.setItem(storageKey, JSON.stringify(updated));
            }
            
            successfulScans.push({
              description: data.description,
              amount: data.amount,
              vendor: data.vendor
            });
            
            console.log("Expense added:", newExpense.description, newExpense.amount);
          } else {
            console.log("Scan returned error or missing data:", data.error);
          }
        } else {
          console.error("API returned error status:", response.status);
        }
      } catch (error) {
        console.error(`Error scanning receipt ${i + 1}:`, error);
      }
    }
    
    // Update React state with final project
    if (currentProject) {
      setProject(currentProject);
    }
    
    // Reset states
    setScanning(false);
    setMultiScanQueue([]);
    setMultiScanIndex(0);
    setSelectedImage(null);
    setScanTimer(0);
    setShowAddExpense(false); // Close the modal
    
    // Show nice success message
    if (successfulScans.length > 0) {
      const totalAmount = successfulScans.reduce((sum, s) => sum + s.amount, 0);
      setMultiScanSuccessMessage({
        count: successfulScans.length,
        totalAmount,
        items: successfulScans
      });
      setShowMultiScanSuccess(true);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    console.log("Files selected:", fileList?.length);
    if (!fileList || fileList.length === 0) return;
    
    // Read files into array immediately (FileList might become invalid after reset)
    const fileCount = Math.min(fileList.length, 3);
    console.log("Will process", fileCount, "files");
    
    // Helper function to read single file as base64
    const readFileAsBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    };
    
    // Read all files to base64 BEFORE resetting input
    const base64Images: string[] = [];
    for (let i = 0; i < fileCount; i++) {
      const file = fileList[i];
      console.log("Reading file", i + 1, ":", file?.name, file?.size, "bytes");
      try {
        const base64 = await readFileAsBase64(file);
        base64Images.push(base64);
        console.log("File", i + 1, "converted, base64 length:", base64.length);
      } catch (err) {
        console.error("Error reading file", i + 1, err);
      }
    }
    
    // Reset input AFTER reading all files
    e.target.value = '';
    
    console.log("Total images converted:", base64Images.length);
    
    if (base64Images.length === 0) {
      alert("לא הצלחתי לקרוא את הקבצים. נסה שוב.");
      return;
    }
    
    // If multiple files, process them sequentially
    if (base64Images.length > 1) {
      console.log("Starting multi-scan with", base64Images.length, "images");
      
      setSelectedImage(base64Images[0]);
      setScanning(true);
      setMultiScanQueue(base64Images);
      setMultiScanIndex(0);
      setMultiScanResults([]);
      setScanTimer(30);
      setScanTip(SCAN_TIPS[Math.floor(Math.random() * SCAN_TIPS.length)]);
      
      setTimeout(() => {
        processMultiScan(base64Images, 0);
      }, 100);
      return;
    }
    
    // Single file - use the already converted base64
    const base64 = base64Images[0];
    setSelectedImage(base64);
    setScanning(true);
    setScanTimer(30);
    setScanTip(SCAN_TIPS[Math.floor(Math.random() * SCAN_TIPS.length)]);
    
    // Continue with single file scan...
    const userData = localStorage.getItem("user");
    const userEmail = userData ? JSON.parse(userData).email : null;
    
    try {
      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, userEmail }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          alert("שגיאה בסריקה: " + data.error);
        } else {
          if (data.description) setDescription(data.description);
          if (data.amount) setAmount(data.amount.toString());
          if (data.category && CATEGORIES.includes(data.category)) setCategory(data.category);
          setScannedVendor(data.vendor || "");
          setScannedItems(Array.isArray(data.items) ? data.items : []);
          setScannedFullText(data.fullText || "");
          setScannedVatAmount(data.vatAmount || null);
          setScannedDate(data.date || "");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`שגיאה בסריקה (${response.status}): ${errorData.error || 'נסה שוב'}`);
      }
    } catch (error: unknown) {
      console.error("Scan error:", error);
      alert("שגיאה בסריקה - בדוק את החיבור לאינטרנט");
    }
    
    setScanning(false);
    setScanTimer(0);
  };

  const [quoteError, setQuoteError] = useState<string | null>(null);
  
  const handleQuoteAnalysis = async () => {
    if (!quoteText.trim()) return;
    
    setAnalyzing(true);
    setQuoteAnalysis(null);
    setQuoteError(null);
    try {
      const response = await fetch("/api/analyze-quote-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: quoteText, budget: project?.budget }),
      });
      const data = await response.json();
      if (response.ok) {
        setQuoteAnalysis(data.analysis);
      } else if (data.error === "INVALID_INPUT") {
        setQuoteError("INVALID_INPUT");
      } else {
        setQuoteError("GENERAL_ERROR");
      }
    } catch {
      setQuoteError("GENERAL_ERROR");
    }
    setAnalyzing(false);
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
      const userData = localStorage.getItem("user");
      const userEmailForChat = userData ? JSON.parse(userData).email : null;
      
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          userEmail: userEmailForChat,
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
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("נא להזין סכום תקין");
      return;
    }
    
    const newExpense: Expense = {
      id: Date.now().toString(),
      description,
      amount: amountNum,
      category,
      date: new Date().toISOString(),
      invoiceDate: scannedDate || undefined,
      imageUrl: selectedImage || undefined,
      vendor: scannedVendor || undefined,
      items: scannedItems.length > 0 ? scannedItems : undefined,
      fullText: scannedFullText || undefined,
      vatAmount: scannedVatAmount || undefined,
    };
    const updatedProject = {
      ...project,
      expenses: [...(project.expenses || []), newExpense],
      spent: project.spent + amountNum,
    };
    saveProject(updatedProject);
    setShowAddExpense(false);
    setDescription("");
    setAmount("");
    setCategory(CATEGORIES[0]);
    setSelectedImage(null);
    setScannedVendor("");
    setScannedItems([]);
    setScannedFullText("");
    setScannedVatAmount(null);
    setScannedDate("");
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
    
    const amountNum = parseFloat(quoteAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("נא להזין סכום תקין");
      return;
    }
    
    const newQuote: SavedQuote = {
      id: Date.now().toString(),
      supplierName: quoteSupplierName,
      description: quoteDescription,
      amount: amountNum,
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
    setVisionError(null);
    
    try {
      // Get user email for server-side subscription validation
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      
      const response = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: visionImage,
          description: visionDescription,
          userEmail: userData.email || null
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setVisionResult({
          analysis: data.analysis,
          generatedImage: data.generatedImage,
          costs: data.costs
        });
        incrementVisionUsage();
        
        // Save to history
        if (data.generatedImage && visionImage) {
          const historyItem: VisionHistoryItem = {
            id: Date.now().toString(),
            date: new Date().toLocaleString('he-IL'),
            beforeImage: visionImage,
            afterImage: data.generatedImage,
            description: visionDescription,
            analysis: data.analysis,
            costs: { total: data.costs.total }
          };
          // Limit history to 20 items to prevent localStorage overflow
          const newHistory = [historyItem, ...visionHistory].slice(0, 20);
          setVisionHistory(newHistory);
          localStorage.setItem(`visionHistory-${params.id}`, JSON.stringify(newHistory));
        }
      } else if (data.error === "IMAGE_NOT_SUPPORTED") {
        // Image couldn't be processed - show friendly error in UI, no analysis
        setVisionError(data.message || 'לא ניתן לעבד את התמונה הזו. נסה להעלות תמונה אחרת של החדר.');
        setVisionResult(null);  // Don't show any results
      } else {
        setVisionError('שגיאה ביצירת ההדמיה. נסה שוב.');
      }
    } catch {
      setVisionError('שגיאה בתקשורת. נסה שוב.');
    }
    
    setVisionLoading(false);
  };

  const resetVision = () => {
    setVisionImage(null);
    setVisionDescription("");
    setVisionResult(null);
  };

  const handleProductSearch = async (imageUrl: string) => {
    setProductSearchImage(imageUrl);
    setShowProductSearch(true);
    setProductSearchLoading(true);
    setDetectedProducts([]);
    
    try {
      const userData = localStorage.getItem("user");
      const userEmailForProducts = userData ? JSON.parse(userData).email : null;
      
      const response = await fetch('/api/detect-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl, userEmail: userEmailForProducts })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDetectedProducts(data.products || []);
      }
    } catch {
      console.error('Product detection failed');
    }
    
    setProductSearchLoading(false);
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

  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">טוען...</div>
      </div>
    );
  }

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
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-6 min-w-0">
            <Link href="/" className="text-base font-semibold text-gray-900 hover:text-blue-600 flex-shrink-0">ShiputzAI</Link>
            <Link href="/" className="hidden md:block text-sm text-gray-500 hover:text-gray-900">דף הבית</Link>
            <Link href="/dashboard" className="text-xs md:text-sm text-gray-500 hover:text-gray-900 flex-shrink-0">לוח בקרה</Link>
            <span className="hidden md:inline text-gray-300">|</span>
            <span className="text-xs md:text-sm text-gray-900 truncate max-w-[100px] md:max-w-none">{project.name}</span>
          </div>
          <div className="hidden md:flex gap-2">
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
      <div className="border-b border-gray-100 print:hidden overflow-x-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex gap-4 md:gap-6">
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
                  <img src="/icons/sparkles.png" alt="" className="w-6 h-6" />
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
                  onClick={() => { setShowQuoteAnalysis(true); setQuoteAnalysis(null); setQuoteText(""); setQuoteError(null); }}
                  className="text-right bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:bg-gray-100 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] active:bg-gray-100 transition-all"
                >
                  <p className="font-medium text-gray-900 mb-1">ניתוח הצעת מחיר</p>
                  <p className="text-sm text-gray-500">בדוק אם המחיר סביר</p>
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
              <div className="flex items-center justify-between mb-4">
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
              
              {/* Filters & Sort */}
              {project.expenses && project.expenses.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 print:hidden">
                  <select
                    value={expenseFilter}
                    onChange={(e) => setExpenseFilter(e.target.value)}
                    className="text-sm border border-gray-200 rounded-full px-3 py-1.5 bg-white"
                  >
                    <option value="all">כל הקטגוריות</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    value={expenseSort}
                    onChange={(e) => setExpenseSort(e.target.value as any)}
                    className="text-sm border border-gray-200 rounded-full px-3 py-1.5 bg-white"
                  >
                    <option value="date-desc">תאריך (חדש → ישן)</option>
                    <option value="date-asc">תאריך (ישן → חדש)</option>
                    <option value="amount-desc">סכום (גבוה → נמוך)</option>
                    <option value="amount-asc">סכום (נמוך → גבוה)</option>
                  </select>
                  {expenseFilter !== 'all' && (
                    <span className="text-sm text-gray-500 self-center">
                      {getFilteredExpenses().length} מתוך {project.expenses.length}
                    </span>
                  )}
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />

              {!project.expenses || project.expenses.length === 0 ? (
                <p className="text-gray-500 text-center py-12">אין הוצאות עדיין</p>
              ) : getFilteredExpenses().length === 0 ? (
                <p className="text-gray-500 text-center py-12">אין הוצאות בקטגוריה זו</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {getFilteredExpenses().map((expense) => (
                    <div 
                      key={expense.id} 
                      className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <div className="flex items-center gap-4">
                        {expense.imageUrl && (
                          <img src={expense.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg print:hidden" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          <p className="text-sm text-gray-500">
                            {expense.vendor ? `${expense.vendor} · ` : ""}{expense.category} · {new Date(expense.date).toLocaleDateString("he-IL")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">₪{expense.amount.toLocaleString()}</p>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
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
          <div className="space-y-6">
            {/* AI Visualizations History */}
            <div className="border border-purple-200 rounded-2xl p-8 bg-gradient-to-br from-purple-50/50 to-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">איך זה יראה?</h2>
                  {visionHistory.length > 0 && (
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">{visionHistory.length}</span>
                  )}
                </div>
                <button
                  onClick={() => setShowAIVision(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm hover:from-purple-700 hover:to-blue-700"
                >
                  צור הדמיה חדשה
                </button>
              </div>

              {visionHistory.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-2">אין הדמיות עדיין</p>
                  <p className="text-sm text-gray-400">העלה תמונה של החדר וקבל הדמיה של איך השיפוץ יראה</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visionHistory.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">לפני</p>
                          <img src={item.beforeImage} alt="Before" className="w-full h-28 object-cover rounded-lg" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">אחרי</p>
                          <div 
                            className="relative cursor-pointer group"
                            onClick={() => {
                              // Save image to localStorage for shop-look page
                              localStorage.setItem('shopLookImage', item.afterImage);
                              window.open('/shop-look', '_blank');
                            }}
                          >
                            <img src={item.afterImage} alt="After" className="w-full h-28 object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
                              <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium flex items-center gap-1"><img src="/icons/cart.png" alt="" className="w-4 h-4" /> קנה את הסגנון</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>{item.date}</span>
                        <span className="font-medium text-purple-600">₪{item.costs.total.toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => setSelectedVisionItem(item)}
                        className="w-full bg-gray-900 text-white text-xs py-2 rounded-full hover:bg-gray-800 transition-colors"
                      >
                        📋 ראה פירוט עלויות
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Gallery */}
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
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">הוסף הוצאה</h2>
            
            <div className="mb-6">
              {selectedImage ? (
                <div className="relative">
                  <img src={selectedImage} alt="" className="w-full h-40 object-cover rounded-xl" />
                  <button onClick={() => setSelectedImage(null)} className="absolute top-2 left-2 bg-black/50 text-white w-8 h-8 rounded-full">✕</button>
                  {scanning && (
                    <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center rounded-xl p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                      {multiScanQueue.length > 1 ? (
                        <>
                          <p className="text-gray-800 font-medium mb-1">סורק קבלה {multiScanIndex + 1} מתוך {multiScanQueue.length}...</p>
                          <div className="w-32 h-2 bg-gray-200 rounded-full mt-2 mb-2">
                            <div 
                              className="h-full bg-blue-600 rounded-full transition-all duration-300" 
                              style={{ width: `${((multiScanIndex + 1) / multiScanQueue.length) * 100}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-800 font-medium mb-1">סורק קבלה...</p>
                      )}
                      {scanTimer > 0 ? (
                        <p className="text-gray-500 text-sm">עד {scanTimer} שניות {multiScanQueue.length > 1 ? "לכל קבלה" : ""}</p>
                      ) : (
                        <p className="text-orange-500 text-sm">לוקח יותר זמן מהרגיל...</p>
                      )}
                      {scanTip && (
                        <p className="text-blue-600 text-xs mt-3 text-center">{scanTip}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors"
                >
                  <span className="text-sm">צלם קבלה או העלה תמונות (עד 3)</span>
                </button>
              )}
            </div>

            {/* AI Analysis Results */}
            {selectedImage && !scanning && (scannedVendor || (scannedItems && scannedItems.length > 0) || scannedFullText) && (
              <div className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-3">
                  <img src="/icons/sparkles.png" alt="" className="w-4 h-4" />
                  <p className="text-sm font-medium text-purple-900">ניתוח AI</p>
                </div>
                
                {scannedVendor && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">בעל מקצוע / עסק:</span>
                    <p className="text-sm font-medium text-gray-900">{scannedVendor}</p>
                  </div>
                )}
                
                {scannedItems && scannedItems.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">פריטים שזוהו:</span>
                    <div className="mt-1 space-y-1">
                      {scannedItems.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.name} {item.quantity && `(${item.quantity})`}</span>
                          {item.price && <span className="text-gray-600">₪{item.price}</span>}
                        </div>
                      ))}
                      {scannedItems.length > 5 && (
                        <p className="text-xs text-gray-400">+ {scannedItems.length - 5} פריטים נוספים</p>
                      )}
                    </div>
                  </div>
                )}

                {scannedVatAmount && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">מע״מ:</span>
                    <p className="text-sm font-medium text-gray-900">₪{scannedVatAmount}</p>
                  </div>
                )}
                
                {scannedFullText && (!scannedItems || scannedItems.length === 0) && (
                  <div>
                    <span className="text-xs text-gray-500">טקסט שזוהה:</span>
                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap line-clamp-3">{scannedFullText}</p>
                  </div>
                )}
              </div>
            )}

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
              <button onClick={handleAddExpense} disabled={!description || !amount || scanning} className="flex-1 bg-gray-900 text-white py-3 rounded-full hover:bg-gray-800 disabled:opacity-30 flex items-center justify-center gap-2">
                {scanning ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    ממתין לסריקה...
                  </>
                ) : (
                  "הוסף"
                )}
              </button>
              <button onClick={() => { setShowAddExpense(false); setDescription(""); setAmount(""); setSelectedImage(null); setScannedVendor(""); setScannedItems([]); setScannedFullText(""); setScannedVatAmount(null); setScannedDate(""); setScanTimer(0); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="flex-1 border border-gray-200 text-gray-900 py-3 rounded-full hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Scan Success Modal */}
      {showMultiScanSuccess && multiScanSuccessMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowMultiScanSuccess(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">הסריקה הושלמה!</h2>
              <p className="text-gray-500">
                {multiScanSuccessMessage.count} קבלות נסרקו ונוספו להוצאות
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                <span className="text-gray-500">סה״כ נוסף:</span>
                <span className="text-xl font-bold text-gray-900">₪{multiScanSuccessMessage.totalAmount.toLocaleString()}</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {multiScanSuccessMessage.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 truncate flex-1">{item.description}</span>
                    <span className="text-gray-900 font-medium mr-2">₪{item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => setShowMultiScanSuccess(false)}
              className="w-full bg-gray-900 text-white py-3 rounded-full hover:bg-gray-800"
            >
              סגור
            </button>
          </div>
        </div>
      )}

      {/* Expense Details Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { setSelectedExpense(null); setEditingExpense(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">פרטי הוצאה</h2>
              <button 
                onClick={() => { setSelectedExpense(null); setEditingExpense(false); }} 
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Receipt Image */}
              {selectedExpense.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <img 
                    src={selectedExpense.imageUrl} 
                    alt="קבלה" 
                    className="w-full object-contain max-h-64"
                  />
                </div>
              )}
              
              {/* Main Info */}
              <div className="space-y-4">
                {editingExpense ? (
                  <>
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">תיאור</label>
                      <input
                        type="text"
                        value={editExpenseData.description || ''}
                        onChange={(e) => setEditExpenseData({...editExpenseData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">סכום (₪)</label>
                      <input
                        type="number"
                        value={editExpenseData.amount || ''}
                        onChange={(e) => setEditExpenseData({...editExpenseData, amount: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">בעל מקצוע / עסק</label>
                      <input
                        type="text"
                        value={editExpenseData.vendor || ''}
                        onChange={(e) => setEditExpenseData({...editExpenseData, vendor: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">קטגוריה</label>
                      <select
                        value={editExpenseData.category || ''}
                        onChange={(e) => setEditExpenseData({...editExpenseData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    {(editExpenseData.fullText || selectedExpense?.fullText) && (
                      <div>
                        <label className="text-sm text-gray-500 block mb-1">טקסט מלא מהקבלה</label>
                        <textarea
                          value={editExpenseData.fullText ?? selectedExpense?.fullText ?? ''}
                          onChange={(e) => setEditExpenseData({...editExpenseData, fullText: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 text-sm"
                          rows={6}
                          dir="rtl"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">תיאור</p>
                        <p className="text-lg font-medium text-gray-900">{selectedExpense.description}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-gray-500">סכום</p>
                        <p className="text-2xl font-bold text-gray-900">₪{selectedExpense.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {selectedExpense.vendor && (
                        <div>
                          <p className="text-sm text-gray-500">בעל מקצוע / עסק</p>
                          <p className="font-medium text-gray-900">{selectedExpense.vendor}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">קטגוריה</p>
                        <p className="font-medium text-gray-900">{selectedExpense.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">תאריך הוספה</p>
                        <p className="font-medium text-gray-900">{new Date(selectedExpense.date).toLocaleDateString("he-IL")}</p>
                      </div>
                      {selectedExpense.invoiceDate && (
                        <div>
                          <p className="text-sm text-gray-500">תאריך חשבונית</p>
                          <p className="font-medium text-gray-900">{new Date(selectedExpense.invoiceDate).toLocaleDateString("he-IL")}</p>
                        </div>
                      )}
                      {selectedExpense.vatAmount && (
                        <div>
                          <p className="text-sm text-gray-500">מע״מ</p>
                          <p className="font-medium text-gray-900">₪{selectedExpense.vatAmount.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Items Breakdown */}
              {selectedExpense.items && selectedExpense.items.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-3">פירוט פריטים</p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    {selectedExpense.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.name}
                          {item.quantity && item.quantity > 1 && ` (×${item.quantity})`}
                        </span>
                        {item.price && (
                          <span className="text-gray-900 font-medium">₪{item.price.toLocaleString()}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Full Text from Receipt */}
              {selectedExpense.fullText && (
                <div>
                  <p className="text-sm text-gray-500 mb-3">טקסט מלא מהקבלה</p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedExpense.fullText}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 space-y-2">
              {editingExpense ? (
                <>
                  <button 
                    onClick={saveEditedExpense}
                    className="w-full bg-blue-600 text-white py-3 rounded-full font-medium hover:bg-blue-700 transition-colors"
                  >
                    💾 שמור שינויים
                  </button>
                  <button 
                    onClick={() => setEditingExpense(false)}
                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-full font-medium hover:bg-gray-300 transition-colors"
                  >
                    ביטול
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { setEditingExpense(true); setEditExpenseData(selectedExpense); }}
                    className="w-full bg-blue-600 text-white py-3 rounded-full font-medium hover:bg-blue-700 transition-colors"
                  >
                    ✏️ ערוך פרטים
                  </button>
                  <button 
                    onClick={() => deleteExpense(selectedExpense.id)}
                    className="w-full bg-red-500 text-white py-3 rounded-full font-medium hover:bg-red-600 transition-colors"
                  >
                    🗑️ מחק הוצאה
                  </button>
                  <button 
                    onClick={() => { setSelectedExpense(null); setEditingExpense(false); }}
                    className="w-full bg-gray-900 text-white py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
                  >
                    סגור
                  </button>
                </>
              )}
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
                <img src="/icons/sparkles.png" alt="" className="w-6 h-6" />
                <h2 className="text-lg font-semibold text-gray-900">איך השיפוץ שלי יראה? - הדמיית שיפוץ</h2>
              </div>
              <div className="flex items-center gap-3">
                {visionHistory.length > 0 && (
                  <button 
                    onClick={() => setShowVisionHistory(!showVisionHistory)}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${showVisionHistory ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <span>🕐</span>
                    <span>היסטוריה ({visionHistory.length})</span>
                  </button>
                )}
                <button onClick={() => { setShowAIVision(false); resetVision(); setShowVisionHistory(false); }} className="text-gray-500 hover:text-gray-900">✕</button>
              </div>
            </div>
            
            <div className="p-6">
              <input ref={visionInputRef} type="file" accept="image/*" onChange={handleVisionImageSelect} className="hidden" />
              
              {/* History View */}
              {showVisionHistory ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">היסטוריית הדמיות</h3>
                    <button 
                      onClick={() => setShowVisionHistory(false)}
                      className="text-purple-600 hover:text-purple-700 text-sm"
                    >
                      ← חזור להדמיה חדשה
                    </button>
                  </div>
                  
                  {visionHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">אין עדיין הדמיות</p>
                  ) : (
                    <div className="grid gap-4">
                      {visionHistory.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">לפני</p>
                                  <img src={item.beforeImage} alt="Before" className="w-full h-32 object-cover rounded-lg" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">אחרי</p>
                                  <img src={item.afterImage} alt="After" className="w-full h-32 object-cover rounded-lg" />
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{item.date}</span>
                                <span className="font-medium text-purple-600">₪{item.costs.total.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
              <>
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
                        <img src="/icons/sparkles.png" alt="" className="w-4 h-4 inline" />
                        תן לי לראות
                      </>
                    )}
                  </button>
                  
                  {visionLoading && (
                    <div className="text-center text-sm space-y-2">
                      <p className="text-gray-900">{loadingTips[currentTipIndex]}</p>
                      {countdown > 0 ? (
                        <p className="text-gray-500">עוד {countdown} שניות...</p>
                      ) : (
                        <p className="text-orange-600">לוקח יותר זמן מהרגיל, עוד רגע...</p>
                      )}
                    </div>
                  )}
                  
                  {visionError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <p className="text-red-600 font-medium mb-2">⚠️ לא הצלחנו לעבד את התמונה</p>
                      <p className="text-red-500 text-sm">{visionError}</p>
                      <button
                        onClick={() => { setVisionError(null); setVisionImage(null); }}
                        className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
                      >
                        נסה תמונה אחרת
                      </button>
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
                        <div className="w-full h-64 rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
                          <div className="text-center p-4">
                            <span className="text-4xl mb-2 block">📷</span>
                            <p className="text-orange-700 font-medium">לא הצלחנו ליצור הדמיה לתמונה זו</p>
                            <p className="text-orange-600 text-sm">נסה להעלות תמונה אחרת באיכות טובה יותר</p>
                            <button
                              onClick={() => resetVision()}
                              className="mt-2 text-sm text-orange-600 hover:text-orange-700 underline"
                            >
                              נסה שוב
                            </button>
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
              </>
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
            
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
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
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur px-6 py-4 flex items-center justify-between border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">ניתוח הצעת מחיר</h2>
              <button onClick={() => setShowQuoteAnalysis(false)} className="text-white/60 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              {/* Input State */}
              {!quoteAnalysis && !analyzing && (
                <div>
                  <label className="block text-sm text-purple-200 mb-3">תאר את הצעת המחיר שקיבלת:</label>
                  <textarea
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder="לדוגמה:&#10;צביעת דירת 4 חדרים - 8,000 ש״ח&#10;החלפת ברז במטבח - 450 ש״ח&#10;התקנת מזגן כולל נקודה - 2,500 ש״ח"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 h-36 resize-none text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-right"
                    dir="rtl"
                  />
                  <button
                    onClick={handleQuoteAnalysis}
                    disabled={!quoteText.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3.5 rounded-full font-medium mt-5 hover:from-purple-600 hover:to-indigo-600 transition-all disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed shadow-lg"
                  >
                    נתח הצעה
                  </button>
                </div>
              )}
              
              {/* Loading State */}
              {analyzing && (
                <div className="py-16 flex flex-col items-center justify-center">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-400 animate-spin"></div>
                    <div className="absolute inset-3 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-white/90 font-medium text-lg mb-2">מנתח את ההצעה</p>
                  <p className="text-purple-300/70 text-sm">משווה למחירי שוק ממידרג...</p>
                </div>
              )}
              
              {/* Error State */}
              {quoteError && !analyzing && (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-5">
                    <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-white font-medium text-lg mb-2">לא הצלחתי להבין את ההצעה</p>
                  <p className="text-purple-200/70 text-sm mb-6 max-w-xs">
                    כדי לנתח הצעת מחיר, כתוב את סוג העבודה והמחיר שקיבלת.
                    <br />
                    לדוגמה: &quot;צביעת דירת 3 חדרים - 5,000 ש״ח&quot;
                  </p>
                  <button
                    onClick={() => { setQuoteError(null); setQuoteText(""); }}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3.5 rounded-full font-medium hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg"
                  >
                    נסה שוב
                  </button>
                </div>
              )}
              
              {/* Results State */}
              {quoteAnalysis && !analyzing && !quoteError && (
                <>
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-5 mb-5 border border-white/10">
                    <div className="whitespace-pre-wrap text-white/90 text-sm leading-relaxed">{quoteAnalysis}</div>
                  </div>
                  <button
                    onClick={() => { setQuoteAnalysis(null); setQuoteText(""); }}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3.5 rounded-full font-medium hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg mb-3"
                  >
                    נתח הצעה נוספת
                  </button>
                </>
              )}
              
              <button onClick={() => setShowQuoteAnalysis(false)} className="w-full bg-white/10 text-white/80 py-3 rounded-full hover:bg-white/20 transition-all border border-white/10">סגור</button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <img src="/icons/palette.png" alt="" className="w-10 h-10" />
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

      {/* Vision Item Detail Modal */}
      {selectedVisionItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full relative max-h-[95vh] overflow-auto">
            <button
              onClick={() => setSelectedVisionItem(null)}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">📋 פירוט הדמיה</h3>
              <p className="text-sm text-gray-500">{selectedVisionItem.date}</p>
            </div>
            
            {/* Before/After */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <img src={selectedVisionItem.beforeImage} alt="לפני" className="w-full rounded-2xl" />
                <span className="absolute top-3 right-3 bg-gray-900 text-white text-sm px-3 py-1 rounded-full">לפני</span>
              </div>
              <div className="relative">
                <img src={selectedVisionItem.afterImage} alt="אחרי" className="w-full rounded-2xl" />
                <span className="absolute top-3 right-3 bg-green-500 text-white text-sm px-3 py-1 rounded-full">אחרי ✨</span>
              </div>
            </div>
            
            {/* Description */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">📝 מה ביקשת</h4>
              <p className="text-gray-700 text-sm">{selectedVisionItem.description}</p>
            </div>
            
            {/* Analysis */}
            {selectedVisionItem.analysis && (
              <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">🔍 ניתוח מקצועי</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{selectedVisionItem.analysis}</p>
              </div>
            )}
            
            {/* Cost Breakdown */}
            <div className="bg-purple-50 rounded-2xl p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">💰 הערכת עלויות</h4>
              {selectedVisionItem.costs.items && selectedVisionItem.costs.items.length > 0 ? (
                <div className="space-y-2">
                  {selectedVisionItem.costs.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.description}</span>
                      <span className="font-medium">₪{item.total?.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-purple-200 pt-2 mt-2 flex justify-between font-bold">
                    <span>סה״כ משוער</span>
                    <span className="text-purple-600">₪{selectedVisionItem.costs.total?.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-2xl font-bold text-purple-600 mb-1">₪{selectedVisionItem.costs.total?.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">סה״כ משוער</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setSelectedVisionItem(null)}
              className="w-full bg-gray-900 text-white py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              סגור
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
