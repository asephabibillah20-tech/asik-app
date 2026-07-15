"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface DashboardWrapperProps {
  user: {
    name: string;
    role: string;
    nik: string;
  };
  children: React.ReactNode;
}

export default function DashboardWrapper({ user, children }: DashboardWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Backdrop Overlay for Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-35 md:hidden transition-opacity duration-200"
        />
      )}

      {/* Sidebar with mobile slide responsiveness */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 h-full transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar user={user} onClose={() => setIsOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar with Hamburger Menu for Mobile */}
        <Navbar
          title={user.role === "ADMIN" ? "HR Administrator Dashboard" : "Employee Portal"}
          onOpenSidebar={() => setIsOpen(true)}
        />

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
