"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { ChatKitPanel, type FactAction } from "@/components/ChatKitPanel";
import { useColorScheme } from "@/hooks/useColorScheme";
import LogoutButton from "@/components/LogoutButton";
import AuthPage from "@/components/AuthPage";

export default function App() {
  const { scheme, setScheme } = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Only check authentication once
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    fetch("/api/check-auth", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        console.log("[App] Auth check result:", data.authenticated);
        setIsAuthenticated(data.authenticated);
      })
      .catch((error) => {
        console.error("[App] Auth check error:", error);
        setIsAuthenticated(false);
      });
  }, []);

  const handleWidgetAction = useCallback(async (action: FactAction) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[ChatKitPanel] widget action", action);
    }
  }, []);

  const handleResponseEnd = useCallback(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[ChatKitPanel] response end");
    }
  }, []);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Show the main chat interface when authenticated
  console.log("[App] Rendering authenticated chat interface");
  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-100 dark:bg-slate-950 p-4">
      {/* Header with Logout Button */}
      <div className="w-full max-w-5xl flex justify-end items-center mb-4">
        <LogoutButton />
      </div>
      
      {/* Chat Interface */}
      <div className="w-full max-w-5xl">
        <ChatKitPanel
          theme={scheme}
          onWidgetAction={handleWidgetAction}
          onResponseEnd={handleResponseEnd}
          onThemeRequest={setScheme}
        />
      </div>
    </main>
  );
}
