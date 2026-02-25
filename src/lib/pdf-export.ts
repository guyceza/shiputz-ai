import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

// Hebrew-safe text (RTL)
const hebrewText = (doc: jsPDF, text: string, x: number, y: number, options?: { align?: 'right' | 'left' | 'center'; maxWidth?: number }) => {
  // Reverse text for RTL display in jsPDF
  const reversedText = text.split('').reverse().join('');
  doc.text(reversedText, x, y, options);
};

export const generateProjectPDF = async (project: Project, elementId?: string): Promise<void> => {
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
  const primaryColor = [31, 41, 55] as [number, number, number]; // gray-800
  const accentColor = [79, 70, 229] as [number, number, number]; // indigo-600
  const lightGray = [243, 244, 246] as [number, number, number]; // gray-100

  // Header background
  doc.setFillColor(...accentColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Title - ShiputzAI
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
  doc.text(`${project.budget.toLocaleString()}`, margin + colWidth * 0.5, yPos + 22, { align: 'center' });
  
  // Spent
  doc.setFontSize(12);
  doc.text('Spent', margin + colWidth * 1.5, yPos + 10, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(220, 38, 38); // red
  doc.text(`${project.spent.toLocaleString()}`, margin + colWidth * 1.5, yPos + 22, { align: 'center' });
  
  // Remaining
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('Remaining', margin + colWidth * 2.5, yPos + 10, { align: 'center' });
  doc.setFontSize(16);
  doc.setTextColor(34, 197, 94); // green
  doc.text(`${(project.budget - project.spent).toLocaleString()}`, margin + colWidth * 2.5, yPos + 22, { align: 'center' });

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
    { label: '#', x: margin + 5, width: 10 },
    { label: 'Description', x: margin + 15, width: 55 },
    { label: 'Category', x: margin + 70, width: 35 },
    { label: 'Date', x: margin + 105, width: 25 },
    { label: 'Amount', x: margin + 130, width: 25 },
  ];
  
  cols.forEach(col => {
    doc.text(col.label, col.x, yPos + 5.5);
  });
  
  yPos += 8;

  // Table rows
  doc.setFont('helvetica', 'normal');
  const expenses = project.expenses || [];
  
  expenses.forEach((expense, index) => {
    // Check if we need a new page
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    }
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    
    // Row data
    doc.text(`${index + 1}`, cols[0].x, yPos + 5.5);
    
    // Truncate description if too long
    const desc = expense.description.length > 30 ? expense.description.substring(0, 27) + '...' : expense.description;
    doc.text(desc, cols[1].x, yPos + 5.5);
    
    doc.text(expense.category, cols[2].x, yPos + 5.5);
    
    const date = expense.invoiceDate || expense.date;
    doc.text(new Date(date).toLocaleDateString('he-IL'), cols[3].x, yPos + 5.5);
    
    doc.text(`${expense.amount.toLocaleString()}`, cols[4].x, yPos + 5.5);
    
    yPos += 8;
  });

  // Total row
  yPos += 2;
  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL', cols[1].x, yPos + 5.5);
  doc.text(`${project.spent.toLocaleString()}`, cols[4].x, yPos + 5.5);

  // Category breakdown if exists
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
    
    project.categoryBudgets.forEach((cat, index) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${cat.category}: ${cat.allocated.toLocaleString()}`, margin + 5, yPos);
      yPos += 6;
    });
  }

  // Footer
  const footerY = pageHeight - 10;
  doc.setTextColor(156, 163, 175); // gray-400
  doc.setFontSize(8);
  doc.text('Generated by ShiputzAI - shiputzai.com', pageWidth / 2, footerY, { align: 'center' });

  // Save the PDF
  doc.save(`${project.name}-report.pdf`);
};

// Alternative: Capture a specific element as PDF
export const captureElementAsPDF = async (elementId: string, filename: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let yPosition = 10;
  let remainingHeight = imgHeight;

  // Handle multi-page if content is too long
  while (remainingHeight > 0) {
    pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
    remainingHeight -= pageHeight;
    if (remainingHeight > 0) {
      pdf.addPage();
      yPosition = -pageHeight + 10;
    }
  }

  pdf.save(filename);
};
