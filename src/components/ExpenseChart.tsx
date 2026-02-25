"use client";

import { useMemo } from "react";

interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

interface ExpenseChartProps {
  expenses: Array<{ category: string; amount: number }>;
  budget?: number;
  type?: 'pie' | 'bar';
}

const CATEGORY_COLORS: Record<string, string> = {
  'חומרי בניין': '#3B82F6',
  'אינסטלציה': '#10B981',
  'חשמל': '#F59E0B',
  'ריצוף': '#8B5CF6',
  'צבע': '#EC4899',
  'נגרות': '#6366F1',
  'מיזוג': '#14B8A6',
  'אלומיניום': '#F97316',
  'מטבח': '#84CC16',
  'אחר': '#6B7280',
};

export function ExpenseChart({ expenses, budget, type = 'bar' }: ExpenseChartProps) {
  const data = useMemo(() => {
    const grouped: Record<string, number> = {};
    expenses.forEach(exp => {
      grouped[exp.category] = (grouped[exp.category] || 0) + exp.amount;
    });
    
    return Object.entries(grouped)
      .map(([category, amount]) => ({
        category,
        amount,
        color: CATEGORY_COLORS[category] || CATEGORY_COLORS['אחר']
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const maxAmount = Math.max(...data.map(d => d.amount), 1);

  if (type === 'pie') {
    return <PieChart data={data} total={total} />;
  }

  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={item.category} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 font-medium">{item.category}</span>
            <span className="text-gray-900 font-semibold">₪{item.amount.toLocaleString()}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${(item.amount / maxAmount) * 100}%`,
                backgroundColor: item.color
              }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {((item.amount / total) * 100).toFixed(1)}% מסה״כ
          </div>
        </div>
      ))}
    </div>
  );
}

function PieChart({ data, total }: { data: ExpenseData[]; total: number }) {
  const size = 200;
  const center = size / 2;
  const radius = 80;
  const innerRadius = 50;

  let currentAngle = -90; // Start from top

  const slices = data.map(item => {
    const percentage = item.amount / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;
    
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    
    const ix1 = center + innerRadius * Math.cos(startRad);
    const iy1 = center + innerRadius * Math.sin(startRad);
    const ix2 = center + innerRadius * Math.cos(endRad);
    const iy2 = center + innerRadius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const path = `
      M ${ix1} ${iy1}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${ix2} ${iy2}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}
    `;
    
    return { ...item, path, percentage };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} className="transform -rotate-0">
        {slices.map((slice, idx) => (
          <path
            key={slice.category}
            d={slice.path}
            fill={slice.color}
            className="transition-all duration-300 hover:opacity-80 cursor-pointer"
            style={{ 
              transformOrigin: 'center',
              animation: `pieSlice 0.5s ease-out ${idx * 0.1}s both`
            }}
          />
        ))}
        <text x={center} y={center - 8} textAnchor="middle" className="text-lg font-bold fill-gray-900">
          ₪{total.toLocaleString()}
        </text>
        <text x={center} y={center + 12} textAnchor="middle" className="text-xs fill-gray-500">
          סה״כ הוצאות
        </text>
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        {slices.map(slice => (
          <div key={slice.category} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="text-gray-600">{slice.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Monthly trend chart
interface MonthlyData {
  month: string;
  amount: number;
}

export function MonthlyTrendChart({ expenses }: { expenses: Array<{ date: string; amount: number }> }) {
  const monthlyData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      grouped[monthKey] = (grouped[monthKey] || 0) + exp.amount;
    });
    
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, amount]) => {
        const [year, m] = month.split('-');
        const monthNames = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
        return {
          month: monthNames[parseInt(m) - 1],
          amount
        };
      });
  }, [expenses]);

  if (monthlyData.length === 0) return null;

  const maxAmount = Math.max(...monthlyData.map(d => d.amount), 1);
  const chartHeight = 120;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2" style={{ height: chartHeight }}>
        {monthlyData.map((item, idx) => (
          <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs text-gray-600 font-medium">
              ₪{(item.amount / 1000).toFixed(item.amount >= 1000 ? 1 : 0)}k
            </div>
            <div 
              className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600"
              style={{ 
                height: `${(item.amount / maxAmount) * (chartHeight - 40)}px`,
                animationDelay: `${idx * 0.1}s`
              }}
            />
            <div className="text-xs text-gray-500">{item.month}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
