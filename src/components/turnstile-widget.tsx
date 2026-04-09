"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileWidget({
  className,
  inputName = "turnstileToken",
}: {
  className?: string;
  inputName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [token, setToken] = useState("");

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;

    function renderWidget() {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (nextToken: string) => {
          if (cancelled) return;
          setToken(nextToken);
          setVerified(true);
        },
        "error-callback": () => {
          if (cancelled) return;
          setToken("");
          setVerified(false);
        },
        "expired-callback": () => {
          if (cancelled) return;
          setToken("");
          setVerified(false);
        },
        theme: "light",
      });
    }

    // If Turnstile is already loaded, render immediately
    if (window.turnstile) {
      renderWidget();
    } else {
      // Load script if not already present
      const existing = document.querySelector(`script[src^="${SCRIPT_URL}"]`);
      if (!existing) {
        const script = document.createElement("script");
        script.src = SCRIPT_URL;
        script.async = true;
        document.head.appendChild(script);
      }

      // Poll for turnstile to be ready (handles all race conditions)
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 100);

      return () => {
        cancelled = true;
        clearInterval(interval);
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <div className={className}>
      <input type="hidden" name={inputName} value={token} />
      <div ref={containerRef} />
      {!verified ? (
        <p className="mt-1 text-center text-[11px] text-muted">
          Complete the security check above to continue
        </p>
      ) : null}
    </div>
  );
}
