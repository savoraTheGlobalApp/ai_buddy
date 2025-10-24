"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import {
  STARTER_PROMPTS,
  PLACEHOLDER_INPUT,
  GREETING,
  CREATE_SESSION_ENDPOINT,
  WORKFLOW_ID,
  getThemeConfig,
} from "@/lib/config";
import { ErrorOverlay } from "./ErrorOverlay";
import type { ColorScheme } from "@/hooks/useColorScheme";

export type FactAction = {
  type: "save";
  factId: string;
  factText: string;
};

type ChatKitPanelProps = {
  theme: ColorScheme;
  onWidgetAction: (action: FactAction) => Promise<void>;
  onResponseEnd: () => void;
  onThemeRequest: (scheme: ColorScheme) => void;
};

type ErrorState = {
  script: string | null;
  session: string | null;
  integration: string | null;
  retryable: boolean;
};

const isBrowser = typeof window !== "undefined";
const isDev = process.env.NODE_ENV !== "production";

const createInitialErrors = (): ErrorState => ({
  script: null,
  session: null,
  integration: null,
  retryable: false,
});

export function ChatKitPanel({
  theme,
  onWidgetAction,
  onResponseEnd,
  onThemeRequest,
}: ChatKitPanelProps) {
  const processedFacts = useRef(new Set<string>());
  const [errors, setErrors] = useState<ErrorState>(() => createInitialErrors());
  const [isInitializingSession, setIsInitializingSession] = useState(true);
  const isMountedRef = useRef(true);
  const [scriptStatus, setScriptStatus] = useState<
    "pending" | "ready" | "error"
  >(() => {
    if (!isBrowser) return "pending";
    const isReady = window.customElements?.get("openai-chatkit");
    console.log("[ChatKitPanel] Initial script status check:", { isReady, customElements: !!window.customElements });
    return isReady ? "ready" : "pending";
  });
  const [widgetInstanceKey, setWidgetInstanceKey] = useState(0);

  const setErrorState = useCallback((updates: Partial<ErrorState>) => {
    setErrors((current) => ({ ...current, ...updates }));
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    let timeoutId: number | undefined;

    const handleLoaded = () => {
      if (!isMountedRef.current) {
        return;
      }
      setScriptStatus("ready");
      setErrorState({ script: null });
    };

    const handleError = (event: Event) => {
      console.error("Failed to load chatkit.js for some reason", event);
      if (!isMountedRef.current) {
        return;
      }
      setScriptStatus("error");
      const detail = (event as CustomEvent<unknown>)?.detail ?? "unknown error";
      setErrorState({ script: `Error: ${detail}`, retryable: false });
      setIsInitializingSession(false);
    };

    window.addEventListener("chatkit-script-loaded", handleLoaded);
    window.addEventListener(
      "chatkit-script-error",
      handleError as EventListener
    );

    if (window.customElements?.get("openai-chatkit")) {
      console.log("[ChatKitPanel] Script already loaded, calling handleLoaded");
      handleLoaded();
    } else if (scriptStatus === "pending") {
      console.log("[ChatKitPanel] Script not ready, setting timeout");
      timeoutId = window.setTimeout(() => {
        if (!window.customElements?.get("openai-chatkit")) {
          console.log("[ChatKitPanel] Script timeout - component not available");
          handleError(
            new CustomEvent("chatkit-script-error", {
              detail:
                "ChatKit web component is unavailable. Verify that the script URL is reachable.",
            })
          );
        }
      }, 5000);
    }

    return () => {
      window.removeEventListener("chatkit-script-loaded", handleLoaded);
      window.removeEventListener(
        "chatkit-script-error",
        handleError as EventListener
      );
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [scriptStatus, setErrorState]);

  const isWorkflowConfigured = Boolean(
    WORKFLOW_ID && !WORKFLOW_ID.startsWith("wf_replace")
  );

  useEffect(() => {
    if (!isWorkflowConfigured && isMountedRef.current) {
      setErrorState({
        session: "Set NEXT_PUBLIC_CHATKIT_WORKFLOW_ID in your .env.local file.",
        retryable: false,
      });
      setIsInitializingSession(false);
    }
  }, [isWorkflowConfigured, setErrorState]);

  const handleResetChat = useCallback(() => {
    processedFacts.current.clear();
    if (isBrowser) {
      setScriptStatus(
        window.customElements?.get("openai-chatkit") ? "ready" : "pending"
      );
    }
    setIsInitializingSession(true);
    setErrors(createInitialErrors());
    setWidgetInstanceKey((prev) => prev + 1);
  }, []);

  const getClientSecret = useCallback(
    async (currentSecret: string | null) => {
      console.log("[ChatKitPanel] getClientSecret invoked", {
        currentSecretPresent: Boolean(currentSecret),
        workflowId: WORKFLOW_ID,
        endpoint: CREATE_SESSION_ENDPOINT,
        isWorkflowConfigured,
      });

      // If we already have a secret, return it immediately
      if (currentSecret) {
        console.log("[ChatKitPanel] Using existing client secret");
        return currentSecret;
      }

      if (!isWorkflowConfigured) {
        const detail =
          "Set NEXT_PUBLIC_CHATKIT_WORKFLOW_ID in your .env.local file.";
        if (isMountedRef.current) {
          setErrorState({ session: detail, retryable: false });
          setIsInitializingSession(false);
        }
        throw new Error(detail);
      }

      if (isMountedRef.current) {
        setIsInitializingSession(true);
        setErrorState({ session: null, integration: null, retryable: false });
      }

      try {
        const response = await fetch(CREATE_SESSION_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workflow: { id: WORKFLOW_ID },
            chatkit_configuration: {
              // enable attachments
              file_upload: {
                enabled: true,
              },
            },
          }),
        });

        const raw = await response.text();

        console.log("[ChatKitPanel] createSession response", {
          status: response.status,
          ok: response.ok,
          bodyPreview: raw.slice(0, 1600),
        });

        let data: Record<string, unknown> = {};
        if (raw) {
          try {
            data = JSON.parse(raw) as Record<string, unknown>;
          } catch (parseError) {
            console.error(
              "Failed to parse create-session response",
              parseError
            );
          }
        }

        if (!response.ok) {
          const detail = extractErrorDetail(data, response.statusText);
          console.error("Create session request failed", {
            status: response.status,
            body: data,
          });
          throw new Error(detail);
        }

        const clientSecret = data?.client_secret as string | undefined;
        if (!clientSecret) {
          throw new Error("Missing client secret in response");
        }

        if (isMountedRef.current) {
          setErrorState({ session: null, integration: null });
        }

        console.log("[ChatKitPanel] Client secret received, ChatKit should initialize now");
        return clientSecret;
      } catch (error) {
        console.error("Failed to create ChatKit session", error);
        const detail =
          error instanceof Error
            ? error.message
            : "Unable to start ChatKit session.";
        if (isMountedRef.current) {
          setErrorState({ session: detail, retryable: false });
        }
        throw error instanceof Error ? error : new Error(detail);
      } finally {
        if (isMountedRef.current) {
          setIsInitializingSession(false);
        }
      }
    },
    [isWorkflowConfigured, setErrorState]
  );

  // Memoize the ChatKit configuration to prevent re-initialization
  const chatkitConfig = useMemo(() => ({
    api: { getClientSecret },
    theme: {
      colorScheme: theme,
      ...getThemeConfig(theme),
    },
    startScreen: {
      greeting: GREETING,
      prompts: STARTER_PROMPTS,
    },
    composer: {
      placeholder: PLACEHOLDER_INPUT,
      attachments: {
        // Enable attachments
        enabled: true,
      },
    },
    threadItemActions: {
      feedback: false,
    },
    onClientTool: async (invocation: {
      name: string;
      params: Record<string, unknown>;
    }) => {
      if (invocation.name === "switch_theme") {
        const requested = invocation.params.theme;
        if (requested === "light" || requested === "dark") {
          if (isDev) {
            console.debug("[ChatKitPanel] switch_theme", requested);
          }
          onThemeRequest(requested);
          return { success: true };
        }
        return { success: false };
      }

      if (invocation.name === "record_fact") {
        const id = String(invocation.params.fact_id ?? "");
        const text = String(invocation.params.fact_text ?? "");
        if (!id || processedFacts.current.has(id)) {
          return { success: true };
        }
        processedFacts.current.add(id);
        void onWidgetAction({
          type: "save",
          factId: id,
          factText: text.replace(/\s+/g, " ").trim(),
        });
        return { success: true };
      }

      return { success: false };
    },
    onResponseEnd: () => {
      onResponseEnd();
    },
    onResponseStart: () => {
      setErrorState({ integration: null, retryable: false });
    },
    onThreadChange: () => {
      processedFacts.current.clear();
    },
    onError: ({ error }: { error: unknown }) => {
      // Note that Chatkit UI handles errors for your users.
      // Thus, your app code doesn't need to display errors on UI.
      console.error("ChatKit error", error);
    },
  }), [getClientSecret, theme, onThemeRequest, onWidgetAction, onResponseEnd, setErrorState]);

  const chatkit = useChatKit(chatkitConfig);

  const activeError = errors.session ?? errors.integration;
  const blockingError = errors.script ?? activeError;

  console.log("[ChatKitPanel] render state", {
    isInitializingSession,
    hasControl: Boolean(chatkit.control),
    scriptStatus,
    hasError: Boolean(blockingError),
    workflowId: WORKFLOW_ID,
    blockingError,
    widgetInstanceKey,
    willShowChatKit: Boolean(chatkit.control),
    willShowFallback: !chatkit.control && scriptStatus === "ready" && !isInitializingSession && !blockingError
  });

  // Remove force re-initialization that causes infinite loops
  // Let ChatKit initialize naturally

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (isInitializingSession) {
      const timeout = setTimeout(() => {
        console.log("[ChatKitPanel] Timeout reached - ending initialization");
        setIsInitializingSession(false);
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isInitializingSession]);

  // Force ChatKit to render when control is available
  useEffect(() => {
    if (chatkit.control && isInitializingSession) {
      console.log("[ChatKitPanel] ChatKit control available - ending initialization");
      setIsInitializingSession(false);
    }
  }, [chatkit.control, isInitializingSession]);

  // Remove the force re-render that's causing the infinite loop
  // The ChatKit component should render naturally when control is available

  // Track if ChatKit has ever been successfully initialized
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (chatkit.control && !hasInitialized) {
      console.log("[ChatKitPanel] ChatKit successfully initialized");
      setHasInitialized(true);
    }
  }, [chatkit.control, hasInitialized]);

  return (
    <div className="relative pb-8 flex h-[90vh] w-full rounded-2xl flex-col overflow-hidden bg-white shadow-sm transition-colors dark:bg-slate-900">
      {/* Show ChatKit if it has control OR if it has been initialized before */}
      {(chatkit.control || hasInitialized) && (
        <ChatKit
          key={widgetInstanceKey}
          control={chatkit.control}
          style={{
            minHeight: "400px",
            width: "100%",
            display: "block",
            position: "relative",
            zIndex: 1
          }}
        />
      )}
      
      {/* Fallback UI - only show if ChatKit has never been initialized */}
      {!hasInitialized && !chatkit.control && scriptStatus === "ready" && !isInitializingSession && !blockingError && (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-6xl">🤖</div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              AI Buddy is Ready!
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              The chat interface should appear here. If you don&apos;t see it, try refreshing the page.
            </p>
            <button
              onClick={handleResetChat}
              className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Restart Chat
            </button>
          </div>
        </div>
      )}
      
      <ErrorOverlay
        error={blockingError}
        fallbackMessage={
          blockingError || !isInitializingSession
            ? null
            : "Loading assistant session..."
        }
        onRetry={blockingError && errors.retryable ? handleResetChat : null}
        retryLabel="Restart chat"
      />
    </div>
  );
}

function extractErrorDetail(
  payload: Record<string, unknown> | undefined,
  fallback: string
): string {
  if (!payload) {
    return fallback;
  }

  const error = payload.error;
  if (typeof error === "string") {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  const details = payload.details;
  if (typeof details === "string") {
    return details;
  }

  if (details && typeof details === "object" && "error" in details) {
    const nestedError = (details as { error?: unknown }).error;
    if (typeof nestedError === "string") {
      return nestedError;
    }
    if (
      nestedError &&
      typeof nestedError === "object" &&
      "message" in nestedError &&
      typeof (nestedError as { message?: unknown }).message === "string"
    ) {
      return (nestedError as { message: string }).message;
    }
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  return fallback;
}
