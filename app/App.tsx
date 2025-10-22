"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatKitPanel, type FactAction } from "@/components/ChatKitPanel";
import { AccessCodeScreen } from "@/components/AccessCodeScreen";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function App() {
  const { scheme, setScheme } = useColorScheme();
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessCode, setAccessCode] = useState("");

  // Check for existing access on component mount
  useEffect(() => {
    const checkExistingAccess = () => {
      if (typeof window === "undefined") return;

      const storedAccess = localStorage.getItem("ai_buddy_access_granted");
      const storedCode = localStorage.getItem("ai_buddy_access_code");

      if (storedAccess === "true" && storedCode) {
        // Verify the stored access code is still valid
        verifyAccessCode(storedCode);
      } else {
        setIsCheckingAccess(false);
      }
    };

    checkExistingAccess();
  }, []);

  const verifyAccessCode = async (code: string) => {
    try {
      const response = await fetch("/api/validate-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessCode: code }),
      });

      const text = await response.text();
      let data;
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Failed to parse response:", parseError, "Response text:", text);
        // Clear invalid stored access
        localStorage.removeItem("ai_buddy_access_granted");
        localStorage.removeItem("ai_buddy_access_code");
        setHasAccess(false);
        return;
      }

      if (response.ok && data.valid) {
        setAccessCode(code);
        setHasAccess(true);
        console.log("Access verified successfully");
      } else {
        console.log("Access verification failed:", data.error);
        // Clear invalid stored access
        localStorage.removeItem("ai_buddy_access_granted");
        localStorage.removeItem("ai_buddy_access_code");
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Failed to verify access code:", error);
      // Clear stored access on error
      localStorage.removeItem("ai_buddy_access_granted");
      localStorage.removeItem("ai_buddy_access_code");
      setHasAccess(false);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const handleAccessGranted = useCallback((code: string) => {
    setAccessCode(code);
    setHasAccess(true);
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
    <main className="flex min-h-screen flex-col items-center justify-end bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-5xl">
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
