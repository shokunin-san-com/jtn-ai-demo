"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface OfflineContextType {
  offline: boolean;
  setOffline: (v: boolean) => void;
}

const OfflineContext = createContext<OfflineContextType>({
  offline: false,
  setOffline: () => {},
});

export function useOffline() {
  return useContext(OfflineContext);
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [offline, setOfflineState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("jtn-offline-mode");
    if (stored === "true") setOfflineState(true);
    setMounted(true);
  }, []);

  const setOffline = (v: boolean) => {
    setOfflineState(v);
    localStorage.setItem("jtn-offline-mode", String(v));
  };

  if (!mounted) return <>{children}</>;

  return (
    <OfflineContext.Provider value={{ offline, setOffline }}>
      {offline && (
        <div className="bg-amber-500 text-white text-center text-xs font-semibold py-1.5 px-4">
          オフラインモード — API呼び出しをスキップしキャッシュデータを使用中
        </div>
      )}
      {children}
    </OfflineContext.Provider>
  );
}

export function OfflineToggle() {
  const { offline, setOffline } = useOffline();

  return (
    <button
      onClick={() => setOffline(!offline)}
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
        offline
          ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      }`}
      title={offline ? "オフラインモードON" : "オフラインモードOFF"}
    >
      {offline ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.5 6.5a7.5 7.5 0 019 9M6.343 6.343a7.5 7.5 0 0010.607 10.607" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
        </svg>
      )}
      {offline ? "OFFLINE" : "ONLINE"}
    </button>
  );
}
