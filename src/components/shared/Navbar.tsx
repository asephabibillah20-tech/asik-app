"use client";

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  const formattedDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm flex-shrink-0">
      <div>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-full">
          📅 {formattedDate}
        </span>
      </div>
    </header>
  );
}
