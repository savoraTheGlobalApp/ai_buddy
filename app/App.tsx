"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatKitPanel, type FactAction } from "@/components/ChatKitPanel";
import { useColorScheme } from "@/hooks/useColorScheme";
import LogoutButton from "@/components/LogoutButton";
import AuthPage from "@/components/AuthPage";
import { DebugPanel, debugLog } from "@/components/DebugPanel";

export default function App() {
  const { scheme, setScheme } = useColorScheme();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication only once on mount
    let mounted = true;
    
    debugLog('App.tsx - Auth Check', { 
      stage: 'starting',
      authChecked,
      isAuthenticated 
    });
    
    fetch("/api/check-auth", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          console.log("[App] Initial auth check:", data.authenticated);
          debugLog('App.tsx - Auth Check', { 
            stage: 'success',
            authenticated: data.authenticated,
            authChecked: true
          });
          setIsAuthenticated(data.authenticated);
          setAuthChecked(true);
        }
      })
      .catch((error) => {
        if (mounted) {
          console.error("[App] Auth check error:", error);
          debugLog('App.tsx - Auth Check', { 
            stage: 'error',
            error: error.message,
            authChecked: true,
            isAuthenticated: false
          });
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const handleAuthSuccess = useCallback(() => {
    console.log("[App] Authentication successful, showing chat");
    setIsAuthenticated(true);
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

  // Log render state in useEffect to avoid state updates during render
  useEffect(() => {
    if (!authChecked) {
      debugLog('App.tsx - Render', { 
        state: 'loading',
        authChecked,
        isAuthenticated 
      });
    } else if (!isAuthenticated) {
      debugLog('App.tsx - Render', { 
        state: 'auth-page',
        authChecked,
        isAuthenticated 
      });
    } else {
      debugLog('App.tsx - Render', { 
        state: 'chat-interface',
        authChecked,
        isAuthenticated,
        scheme 
      });
    }
  }, [authChecked, isAuthenticated, scheme]);

  // Show loading state while checking authentication
  if (!authChecked) {
    return (
      <>
        <DebugPanel />
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <DebugPanel />
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </>
    );
  }

  // Show the main chat interface when authenticated
  console.log("[App] Rendering chat interface");
  
  return (
    <>
      <DebugPanel />
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
    </>
  );
}
