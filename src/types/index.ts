// ShiputzAI - Shared Type Definitions

export interface ExpenseItem {
  name: string;
  quantity?: number;
  price?: number;
}

export interface Expense {
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

export interface CategoryBudget {
  category: string;
  allocated: number;
}

export interface Phase {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed";
  order: number;
}

export interface Task {
  id: string;
  phaseId: string;
  text: string;
  completed: boolean;
}

export interface ProgressPhoto {
  id: string;
  imageUrl: string;
  date: string;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  profession: string;
  rating: number;
  notes?: string;
}

export interface SavedQuote {
  id: string;
  supplierName: string;
  description: string;
  amount: number;
  date: string;
  imageUrl?: string;
}

export interface Project {
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

export interface User {
  id: string;
  email: string;
  name?: string;
  purchased?: boolean;
  isAdmin?: boolean;
}

export interface VisionHistoryItem {
  id: string;
  date: string;
  beforeImage: string;
  afterImage: string;
  description: string;
  analysis: string;
  costs: { 
    total: number; 
    items?: { description: string; total: number }[];
  };
}

export interface VisionResult {
  analysis: string;
  generatedImage: string | null;
  costs: {
    items: { description: string; quantity: string; unitPrice: number; total: number }[];
    subtotal: number;
    labor: number;
    total: number;
    confidence: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface QuoteAnalysisResult {
  analysis: string;
  verdict: "great" | "ok" | "expensive" | "very_expensive";
}

export interface DetectedProduct {
  name: string;
  description: string;
  searchQuery: string;
}

// Constants
export const CATEGORIES = [
  "חומרי בניין", 
  "עבודה", 
  "חשמל", 
  "אינסטלציה", 
  "ריצוף", 
  "צבע", 
  "מטבח", 
  "אמבטיה", 
  "אחר"
];

export const PROFESSIONS = [
  "קבלן ראשי", 
  "חשמלאי", 
  "אינסטלטור", 
  "רצף", 
  "צבעי", 
  "נגר", 
  "מזגן", 
  "גבס", 
  "אלומיניום", 
  "אחר"
];

export const DEFAULT_PHASES: Omit<Phase, "id">[] = [
  { name: "הריסה", status: "pending", order: 1 },
  { name: "שלד", status: "pending", order: 2 },
  { name: "חשמל", status: "pending", order: 3 },
  { name: "אינסטלציה", status: "pending", order: 4 },
  { name: "טיח וריצוף", status: "pending", order: 5 },
  { name: "גמר", status: "pending", order: 6 },
];
