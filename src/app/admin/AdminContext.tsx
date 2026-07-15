"use client";

import { createContext, useContext, useState } from "react";

interface AdminContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts: {
    leaves: number;
    pkwtt: number;
    pkwt: number;
    admins: number;
    logs: number;
  };
  setCounts: (counts: {
    leaves: number;
    pkwtt: number;
    pkwt: number;
    admins: number;
    logs: number;
  }) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [counts, setCountsState] = useState({
    leaves: 0,
    pkwtt: 0,
    pkwt: 0,
    admins: 0,
    logs: 0,
  });

  const setCounts = (newCounts: typeof counts) => {
    setCountsState(newCounts);
  };

  return (
    <AdminContext.Provider value={{ activeTab, setActiveTab, counts, setCounts }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    // Return a fallback object so it won't crash when accessed outside AdminProvider
    return {
      activeTab: "leaves",
      setActiveTab: () => {},
      counts: { leaves: 0, pkwtt: 0, pkwt: 0, admins: 0, logs: 0 },
      setCounts: () => {},
    };
  }
  return context;
}
