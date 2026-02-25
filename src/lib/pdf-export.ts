'use client';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  invoiceDate?: string;
  vendor?: string;
  vatAmount?: number;
}

interface CategoryBudget {
  category: string;
  allocated: number;
}

interface Project {
  name: string;
  budget: number;
  spent: number;
  expenses?: Expense[];
  categoryBudgets?: CategoryBudget[];
}

export const generateProjectPDF = async (project: Project): Promise<void> => {
  console.log('generateProjectPDF called');
  try {
    // Dynamic import to avoid SSR issues
    console.log('Importing jsPDF...');
    const jsPDFModule = await import('jspdf');
    console.log('jsPDF imported:', jsPDFModule);
    const jsPDF = jsPDFModule.default;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Colors
  const primaryColor: [number, number, number] = [31, 41, 55];
  const accentColor: [number, number, number] = [79, 70, 229];
  const lightGray: [number, number, number] = [243, 244, 246];

  // Header background
  doc.setFillColor(...accentColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ShiputzAI', pageWidth / 2, 15, { align: 'center' });
  
  // Project name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(project.name, pageWidth / 2, 28, { align: 'center' });
  
  // Date
  doc.setFontSize(10);
  const dateStr = new Date().toLocaleDateString('he-IL');
  doc.text(dateStr, pageWidth / 2, 36, { align: 'center' });

  yPos = 55;

  // Budget Summary Box
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  const colWidth = (pageWidth - 2 * margin) / 3;
  
  // Budget
  doc.text('Budget', margin + colWidth * 0.5, yPos + 10, { align: 'center' });
  doc.setFontSize(16);
  doc.text(`${project.budget.toLocaleString()} ILS`, margin + colWidth * 0.5, yPos + 22, { align: 'center' });
  
  // Spent
  doc.setFontSize(12);
  doc.text('Spent', margin + colWidth * 1.5, yPos + 10, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(220, 38, 38);
  doc.text(`${project.spent.toLocaleString()} ILS`, margin + colWidth * 1.5, yPos + 22, { align: 'center' });
  
  // Remaining
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('Remaining', margin + colWidth * 2.5, yPos + 10, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(34, 197, 94);
  doc.text(`${(project.budget - project.spent).toLocaleString()} ILS`, margin + colWidth * 2.5, yPos + 22, { align: 'center' });

  yPos += 40;

  // Expenses Table Header
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Expenses', margin, yPos);
  yPos += 8;

  // Table header
  doc.setFillColor(...accentColor);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  const cols = [
    { label: '#', x: margin + 5 },
    { label: 'Description', x: margin + 15 },
    { label: 'Category', x: margin + 75 },
    { label: 'Date', x: margin + 115 },
    { label: 'Amount', x: margin + 145 },
  ];
  
  cols.forEach(col => {
    doc.text(col.label, col.x, yPos + 5.5);
  });
  
  yPos += 8;

  // Table rows
  doc.setFont('helvetica', 'normal');
  const expenses = project.expenses || [];
  
  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];
    
    // Check if we need a new page
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }
    
    // Alternating row colors
    if (i % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    }
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    
    doc.text(`${i + 1}`, cols[0].x, yPos + 5.5);
    
    const desc = expense.description.length > 35 ? expense.description.substring(0, 32) + '...' : expense.description;
    doc.text(desc, cols[1].x, yPos + 5.5);
    
    const cat = expense.category.length > 15 ? expense.category.substring(0, 12) + '...' : expense.category;
    doc.text(cat, cols[2].x, yPos + 5.5);
    
    const date = expense.invoiceDate || expense.date;
    doc.text(new Date(date).toLocaleDateString('he-IL'), cols[3].x, yPos + 5.5);
    
    doc.text(`${expense.amount.toLocaleString()}`, cols[4].x, yPos + 5.5);
    
    yPos += 8;
  }

  // Total row
  if (expenses.length > 0) {
    yPos += 2;
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL', cols[1].x, yPos + 5.5);
    doc.text(`${project.spent.toLocaleString()} ILS`, cols[4].x, yPos + 5.5);
  }

  // Category breakdown
  if (project.categoryBudgets && project.categoryBudgets.length > 0) {
    yPos += 20;
    
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Category Budgets', margin, yPos);
    yPos += 10;
    
    for (const cat of project.categoryBudgets) {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${cat.category}: ${cat.allocated.toLocaleString()} ILS`, margin + 5, yPos);
      yPos += 6;
    }
  }

  // Footer
  const footerY = pageHeight - 10;
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.text('Generated by ShiputzAI - shipazti.com', pageWidth / 2, footerY, { align: 'center' });

  // Save using blob for better compatibility
  console.log('Creating PDF blob...');
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name}-report.pdf`;
  document.body.appendChild(link);
  console.log('Triggering download...');
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log('PDF download triggered');
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};
