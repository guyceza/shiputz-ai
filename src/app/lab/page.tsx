// Lab index - list of experimental features
import Link from "next/link";

export default function LabPage() {
  const experiments = [
    {
      name: "Blueprint to 3D",
      description: "המרת תוכנית אדריכלית להדמיית 3D",
      href: "/lab/blueprint-3d",
      status: "בפיתוח",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">🧪 מעבדה</h1>
      <p className="text-gray-400 mb-8">תכונות ניסיוניות בפיתוח</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {experiments.map((exp) => (
          <Link
            key={exp.href}
            href={exp.href}
            className="block p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-white">{exp.name}</h2>
              <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full">
                {exp.status}
              </span>
            </div>
            <p className="text-gray-400">{exp.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
