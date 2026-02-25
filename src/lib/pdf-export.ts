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

// Calculate category spending
const getCategorySpending = (expenses: Expense[] = []) => {
  const spending: Record<string, number> = {};
  expenses.forEach(exp => {
    spending[exp.category] = (spending[exp.category] || 0) + exp.amount;
  });
  return Object.entries(spending).sort((a, b) => b[1] - a[1]);
};

// Generate pie chart SVG
const generatePieChart = (data: [string, number][], total: number) => {
  if (data.length === 0) return '';
  
  const colors = ['#4f46e5', '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#f43f5e'];
  let currentAngle = 0;
  const radius = 80;
  const cx = 100;
  const cy = 100;
  
  const paths = data.map(([category, amount], i) => {
    const percentage = amount / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]}" />`;
  }).join('');
  
  const legend = data.map(([category, amount], i) => `
    <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
      <div style="width: 12px; height: 12px; border-radius: 2px; background: ${colors[i % colors.length]};"></div>
      <span style="font-size: 12px; color: #4b5563;">${category}</span>
      <span style="font-size: 12px; font-weight: 600; color: #1f2937; margin-right: auto;">₪${amount.toLocaleString()}</span>
    </div>
  `).join('');
  
  return `
    <div style="display: flex; align-items: center; gap: 30px; justify-content: center;">
      <svg width="200" height="200" viewBox="0 0 200 200">
        ${paths}
        <circle cx="${cx}" cy="${cy}" r="50" fill="white"/>
        <text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="14" fill="#6b7280">סה״כ</text>
        <text x="${cx}" y="${cy + 15}" text-anchor="middle" font-size="18" font-weight="bold" fill="#1f2937">₪${total.toLocaleString()}</text>
      </svg>
      <div style="min-width: 180px;">${legend}</div>
    </div>
  `;
};

export const generateProjectPDF = async (project: Project): Promise<void> => {
  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 794px;
    background: white;
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    color: #1f2937;
  `;

  const remaining = project.budget - project.spent;
  const progress = Math.min((project.spent / project.budget) * 100, 100);
  const categorySpending = getCategorySpending(project.expenses);
  const expenseCount = project.expenses?.length || 0;
  const avgExpense = expenseCount > 0 ? project.spent / expenseCount : 0;
  
  // Get unique vendors
  const vendors = [...new Set(project.expenses?.filter(e => e.vendor).map(e => e.vendor))];
  
  // Get date range
  const dates = project.expenses?.map(e => new Date(e.invoiceDate || e.date)).filter(d => !isNaN(d.getTime())) || [];
  const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

  container.innerHTML = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #7c3aed 100%); color: white; padding: 40px; position: relative; overflow: hidden;">
      <div style="position: absolute; top: -50px; left: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
      <div style="position: absolute; bottom: -30px; right: -30px; width: 150px; height: 150px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
      
      <div style="position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">דוח פרויקט</div>
            <h1 style="margin: 0; font-size: 32px; font-weight: bold;">${project.name}</h1>
            <div style="margin-top: 10px; font-size: 14px; opacity: 0.9;">
              ${minDate && maxDate ? `תקופה: ${minDate.toLocaleDateString('he-IL')} - ${maxDate.toLocaleDateString('he-IL')}` : `תאריך: ${new Date().toLocaleDateString('he-IL')}`}
            </div>
          </div>
          <div style="text-align: left;">
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 1px;">ShiputzAI</div>
            <div style="font-size: 12px; opacity: 0.7;">ניהול שיפוצים חכם</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Metrics -->
    <div style="padding: 30px 40px; background: #f8fafc;">
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1; background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-right: 4px solid #4f46e5;">
          <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">💰 תקציב כולל</div>
          <div style="font-size: 28px; font-weight: bold; color: #1e293b;">₪${project.budget.toLocaleString()}</div>
        </div>
        <div style="flex: 1; background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-right: 4px solid #dc2626;">
          <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">📉 הוצאות</div>
          <div style="font-size: 28px; font-weight: bold; color: #dc2626;">₪${project.spent.toLocaleString()}</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${progress.toFixed(1)}% מהתקציב</div>
        </div>
        <div style="flex: 1; background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-right: 4px solid #16a34a;">
          <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">✅ נותר</div>
          <div style="font-size: 28px; font-weight: bold; color: #16a34a;">₪${remaining.toLocaleString()}</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${(100 - progress).toFixed(1)}% נותר</div>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div style="margin-top: 20px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #64748b;">התקדמות הפרויקט</span>
          <span style="font-size: 13px; font-weight: 600; color: #4f46e5;">${progress.toFixed(1)}%</span>
        </div>
        <div style="background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #4f46e5, #7c3aed); height: 100%; width: ${progress}%; border-radius: 6px; transition: width 0.3s;"></div>
        </div>
      </div>
    </div>

    <!-- Statistics Row -->
    <div style="padding: 0 40px 30px 40px; background: #f8fafc;">
      <div style="display: flex; gap: 15px;">
        <div style="flex: 1; background: white; padding: 15px 20px; border-radius: 10px; display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; background: #ede9fe; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px;">📊</div>
          <div>
            <div style="font-size: 11px; color: #94a3b8;">מספר הוצאות</div>
            <div style="font-size: 18px; font-weight: bold; color: #1e293b;">${expenseCount}</div>
          </div>
        </div>
        <div style="flex: 1; background: white; padding: 15px 20px; border-radius: 10px; display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; background: #fef3c7; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px;">📈</div>
          <div>
            <div style="font-size: 11px; color: #94a3b8;">ממוצע להוצאה</div>
            <div style="font-size: 18px; font-weight: bold; color: #1e293b;">₪${avgExpense.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
          </div>
        </div>
        <div style="flex: 1; background: white; padding: 15px 20px; border-radius: 10px; display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; background: #dcfce7; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px;">👷</div>
          <div>
            <div style="font-size: 11px; color: #94a3b8;">ספקים</div>
            <div style="font-size: 18px; font-weight: bold; color: #1e293b;">${vendors.length}</div>
          </div>
        </div>
        <div style="flex: 1; background: white; padding: 15px 20px; border-radius: 10px; display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; background: #fce7f3; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px;">📁</div>
          <div>
            <div style="font-size: 11px; color: #94a3b8;">קטגוריות</div>
            <div style="font-size: 18px; font-weight: bold; color: #1e293b;">${categorySpending.length}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Breakdown with Chart -->
    ${categorySpending.length > 0 ? `
    <div style="padding: 30px 40px; background: white;">
      <h2 style="margin: 0 0 25px 0; font-size: 20px; color: #1e293b; display: flex; align-items: center; gap: 10px;">
        <span style="width: 4px; height: 24px; background: linear-gradient(180deg, #4f46e5, #7c3aed); border-radius: 2px;"></span>
        חלוקת הוצאות לפי קטגוריה
      </h2>
      ${generatePieChart(categorySpending, project.spent)}
    </div>
    ` : ''}

    <!-- Expenses Table -->
    <div style="padding: 30px 40px;">
      <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #1e293b; display: flex; align-items: center; gap: 10px;">
        <span style="width: 4px; height: 24px; background: linear-gradient(180deg, #4f46e5, #7c3aed); border-radius: 2px;"></span>
        פירוט הוצאות
      </h2>
      
      <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px;">
        <thead>
          <tr>
            <th style="padding: 14px 12px; text-align: right; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border-radius: 10px 0 0 0;">#</th>
            <th style="padding: 14px 12px; text-align: right; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white;">תיאור</th>
            <th style="padding: 14px 12px; text-align: right; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white;">קטגוריה</th>
            <th style="padding: 14px 12px; text-align: right; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white;">ספק</th>
            <th style="padding: 14px 12px; text-align: right; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white;">תאריך</th>
            <th style="padding: 14px 12px; text-align: right; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border-radius: 0 10px 0 0;">סכום</th>
          </tr>
        </thead>
        <tbody>
          ${(project.expenses || []).map((exp, i) => `
            <tr style="background: ${i % 2 === 0 ? '#f8fafc' : 'white'};">
              <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${i + 1}</td>
              <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${exp.description}</td>
              <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0;">
                <span style="background: #ede9fe; color: #7c3aed; padding: 4px 10px; border-radius: 20px; font-size: 11px;">${exp.category}</span>
              </td>
              <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${exp.vendor || '-'}</td>
              <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${new Date(exp.invoiceDate || exp.date).toLocaleDateString('he-IL')}</td>
              <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">₪${exp.amount.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" style="padding: 14px 12px; background: #1e293b; color: white; font-weight: bold; border-radius: 0 0 0 10px;">סה״כ</td>
            <td style="padding: 14px 12px; background: #1e293b; color: white; font-weight: bold; font-size: 16px; border-radius: 0 0 10px 0;">₪${project.spent.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding: 30px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="color: #94a3b8; font-size: 12px;">
          נוצר אוטומטית על ידי ShiputzAI<br/>
          ${new Date().toLocaleDateString('he-IL')} בשעה ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style="text-align: left;">
          <div style="font-weight: bold; color: #4f46e5;">shipazti.com</div>
          <div style="font-size: 11px; color: #94a3b8;">ניהול שיפוצים חכם</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const jsPDF = (await import('jspdf')).default;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL('image/png');
    
    let yPosition = 0;
    let heightLeft = imgHeight;
    
    pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft > 0) {
      pdf.addPage();
      yPosition = heightLeft - imgHeight;
      pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${project.name}-דוח.pdf`);
    
  } finally {
    document.body.removeChild(container);
  }
};
