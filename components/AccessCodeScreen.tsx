"use client";

import { useState, useCallback } from "react";

type AccessCodeScreenProps = {
  onAccessGranted: (accessCode: string) => void;
};

export function AccessCodeScreen({ onAccessGranted }: AccessCodeScreenProps) {
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError("Please enter an access code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Validating access code:", accessCode.trim());
      const response = await fetch("/api/validate-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessCode: accessCode.trim() }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok && data.valid) {
        console.log("Access granted, storing in localStorage");
        // Store access code in localStorage for future visits
        localStorage.setItem("ai_buddy_access_code", accessCode.trim());
        localStorage.setItem("ai_buddy_access_granted", "true");
        onAccessGranted(accessCode.trim());
      } else {
        console.log("Access denied:", data.error);
        setError(data.error || "Invalid access code");
      }
    } catch (err) {
      console.error("Validation error:", err);
      setError("Failed to validate access code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [accessCode, onAccessGranted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              AI Buddy Access
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Enter your access code to start chatting with your AI buddy
            </p>
          </div>

          {/* Access Code Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Code
              </label>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Enter your access code"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !accessCode.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Validating...
                </div>
              ) : (
                "Access AI Buddy"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don&apos;t have an access code? Contact us at {" "}
              <a 
                href="mailto:hello@icurious.ai" 
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                hello@icurious.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
