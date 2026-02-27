// Lab layout - hidden experimental features
// Access via /lab/* - not linked from anywhere

export default function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Lab indicator banner */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2">
        <p className="text-center text-yellow-500 text-sm font-mono">
          🧪 LAB - תכונות ניסיוניות | לא לשימוש בפרודקשן
        </p>
      </div>
      {children}
    </div>
  );
}
