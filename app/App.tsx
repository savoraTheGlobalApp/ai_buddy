"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatKitPanel, type FactAction } from "@/components/ChatKitPanel";
import { useColorScheme } from "@/hooks/useColorScheme";
import LogoutButton from "@/components/LogoutButton";
import AuthPage from "@/components/AuthPage";

export default function App() {
  const { scheme, setScheme } = useColorScheme();
  const [showAuth, setShowAuth] = useState(true);

  useEffect(() => {
    // Check authentication on mount
    fetch("/api/check-auth", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setShowAuth(false);
        }
      })
      .catch(() => {
        setShowAuth(true);
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

  return (
    <>
      {/* Auth overlay - shown on top when not authenticated */}
      {showAuth && (
        <div className="fixed inset-0 z-50 bg-white">
          <AuthPage />
        </div>
      )}

      {/* Main app - always mounted */}
      <main className="flex min-h-screen flex-col items-center justify-end bg-slate-100 dark:bg-slate-950">
        <div className="mx-auto w-full max-w-5xl">
          {/* Header with Logout Button */}
          <div className="flex justify-end items-center p-4">
            <LogoutButton />
          </div>
          
          <ChatKitPanel
            theme={scheme}
            onWidgetAction={handleWidgetAction}
            onResponseEnd={handleResponseEnd}
            onThemeRequest={setScheme}
          />
        </div>
      </main>
    </>
  );
}
