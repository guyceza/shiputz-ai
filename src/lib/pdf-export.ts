'use client';

import html2canvas from 'html2canvas';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  invoiceDate?: string;
  vendor?: string;
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
  // Create a temporary styled div for the PDF
  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 794px;
    background: white;
    padding: 40px;
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    color: #1f2937;
  `;

  const remaining = project.budget - project.spent;
  const progress = Math.min((project.spent / project.budget) * 100, 100);

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; border-radius: 12px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">ShiputzAI</h1>
        <h2 style="margin: 10px 0 0 0; font-size: 20px; font-weight: normal; opacity: 0.9;">${project.name}</h2>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">${new Date().toLocaleDateString('he-IL')}</p>
      </div>
    </div>

    <div style="display: flex; gap: 20px; margin-bottom: 30px;">
      <div style="flex: 1; background: #f3f4f6; padding: 20px; border-radius: 12px; text-align: center;">
        <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">תקציב</div>
        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">₪${project.budget.toLocaleString()}</div>
      </div>
      <div style="flex: 1; background: #fef2f2; padding: 20px; border-radius: 12px; text-align: center;">
        <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">הוצאות</div>
        <div style="font-size: 24px; font-weight: bold; color: #dc2626;">₪${project.spent.toLocaleString()}</div>
      </div>
      <div style="flex: 1; background: #f0fdf4; padding: 20px; border-radius: 12px; text-align: center;">
        <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">נותר</div>
        <div style="font-size: 24px; font-weight: bold; color: #16a34a;">₪${remaining.toLocaleString()}</div>
      </div>
    </div>

    <div style="background: #e5e7eb; height: 8px; border-radius: 4px; margin-bottom: 30px; overflow: hidden;">
      <div style="background: linear-gradient(90deg, #4f46e5, #7c3aed); height: 100%; width: ${progress}%; border-radius: 4px;"></div>
    </div>

    <h3 style="font-size: 18px; margin-bottom: 15px; color: #1f2937;">פירוט הוצאות</h3>
    
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr style="background: #4f46e5; color: white;">
          <th style="padding: 12px; text-align: right; border-radius: 8px 0 0 0;">#</th>
          <th style="padding: 12px; text-align: right;">תיאור</th>
          <th style="padding: 12px; text-align: right;">קטגוריה</th>
          <th style="padding: 12px; text-align: right;">תאריך</th>
          <th style="padding: 12px; text-align: right; border-radius: 0 8px 0 0;">סכום</th>
        </tr>
      </thead>
      <tbody>
        ${(project.expenses || []).map((exp, i) => `
          <tr style="background: ${i % 2 === 0 ? '#f9fafb' : 'white'};">
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${i + 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${exp.description}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${exp.category}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${new Date(exp.invoiceDate || exp.date).toLocaleDateString('he-IL')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">₪${exp.amount.toLocaleString()}</td>
          </tr>
        `).join('')}
        <tr style="background: #1f2937; color: white; font-weight: bold;">
          <td colspan="4" style="padding: 12px; border-radius: 0 0 0 8px;">סה״כ</td>
          <td style="padding: 12px; border-radius: 0 0 8px 0;">₪${project.spent.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    ${project.categoryBudgets && project.categoryBudgets.length > 0 ? `
      <h3 style="font-size: 18px; margin: 30px 0 15px 0; color: #1f2937;">תקציב לפי קטגוריות</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        ${project.categoryBudgets.map(cat => `
          <div style="background: #f3f4f6; padding: 12px 20px; border-radius: 8px;">
            <span style="color: #6b7280;">${cat.category}:</span>
            <span style="font-weight: 600; margin-right: 8px;">₪${cat.allocated.toLocaleString()}</span>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px;">
      נוצר על ידי ShiputzAI • shipazti.com
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Capture as canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Dynamic import jsPDF
    const jsPDF = (await import('jspdf')).default;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add the image to PDF
    const imgData = canvas.toDataURL('image/png');
    
    let yPosition = 10;
    let heightLeft = imgHeight;
    
    // First page
    pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Additional pages if needed
    while (heightLeft > 0) {
      pdf.addPage();
      yPosition = heightLeft - imgHeight + 10;
      pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download
    pdf.save(`${project.name}-דוח.pdf`);
    
  } finally {
    document.body.removeChild(container);
  }
};
