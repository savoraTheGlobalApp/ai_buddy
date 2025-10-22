"use client";

import Script from "next/script";

export function ChatKitScriptLoader() {
  return (
    <Script
      src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== "undefined") {
          console.log("[ChatKitScriptLoader] Script loaded successfully");
          window.dispatchEvent(new CustomEvent("chatkit-script-loaded"));
        }
      }}
      onError={(error) => {
        console.error("[ChatKitScriptLoader] Script failed to load", error);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("chatkit-script-error", {
              detail: "Failed to load ChatKit script from CDN",
            })
          );
        }
      }}
    />
  );
}

