"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatKitPanel, type FactAction } from "@/components/ChatKitPanel";
import { AccessCodeScreen } from "@/components/AccessCodeScreen";
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
    
    // Log usage for analytics (optional)
    if (action.type === "save") {
      console.info("[Usage] fact recorded", {
        accessCode,
        factId: action.factId,
        timestamp: new Date().toISOString(),
      });
    }
  }, [accessCode]);

  const handleResponseEnd = useCallback(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[ChatKitPanel] response end");
    }
    
    // Log conversation completion for analytics
    console.info("[Usage] conversation completed", {
      accessCode,
      timestamp: new Date().toISOString(),
    });
  }, [accessCode]);

  // Show loading screen while checking access
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Checking access...</p>
        </div>
      </div>
    );
  }

  // Show access code screen if no access
  if (!hasAccess) {
    return <AccessCodeScreen onAccessGranted={handleAccessGranted} />;
  }

  // Show main app if access is granted
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
