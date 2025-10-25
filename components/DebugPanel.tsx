"use client";

import { useEffect, useState } from "react";

/**
 * Debug Panel - Shows real-time state information
 * This helps you see what's happening without setting breakpoints
 * 
 * Toggle visibility with Ctrl+Shift+D
 */

type DebugInfo = {
  timestamp: string;
  component: string;
  state: Record<string, unknown>;
};

export function DebugPanel({ 
  enabled = process.env.NODE_ENV === "development" 
}: { 
  enabled?: boolean 
}) {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState<DebugInfo[]>([]);

  useEffect(() => {
    if (!enabled) return;

    // Listen for custom debug events
    const handleDebugEvent = (event: Event) => {
      const customEvent = event as CustomEvent<DebugInfo>;
      setLogs(prev => [...prev.slice(-20), customEvent.detail]); // Keep last 20 logs
    };

    // Toggle visibility with Ctrl+Shift+D
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setVisible(prev => !prev);
      }
    };

    window.addEventListener('app:debug', handleDebugEvent);
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('app:debug', handleDebugEvent);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [enabled]);

  if (!enabled || !visible) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto bg-black/90 text-white text-xs font-mono p-4 rounded-lg shadow-xl z-[9999] backdrop-blur-md"
    >
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/20">
        <h3 className="font-bold text-sm">Debug Panel (Ctrl+Shift+D to toggle)</h3>
        <button 
          onClick={() => setLogs([])}
          className="text-xs px-2 py-1 bg-red-600 rounded hover:bg-red-700"
        >
          Clear
        </button>
      </div>
      
      {logs.length === 0 ? (
        <p className="text-white/60 text-center py-4">No logs yet...</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log, idx) => (
            <div key={idx} className="border-l-2 border-blue-500 pl-2 py-1">
              <div className="text-white/60 text-[10px]">{log.timestamp}</div>
              <div className="text-green-400 font-semibold">{log.component}</div>
              <pre className="text-white/80 text-[10px] overflow-x-auto">
                {JSON.stringify(log.state, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to emit debug events
 * Usage: debugLog('MyComponent', { myState: value })
 */
export function debugLog(component: string, state: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  
  const event = new CustomEvent('app:debug', {
    detail: {
      timestamp: new Date().toLocaleTimeString(),
      component,
      state
    }
  });
  
  window.dispatchEvent(event);
  
  // Also log to console with styling
  console.log(
    `%c[DEBUG: ${component}]`,
    'background: #2563eb; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
    state
  );
}

