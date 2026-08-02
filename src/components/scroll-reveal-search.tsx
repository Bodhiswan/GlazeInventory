"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const SHOW_AFTER_SCROLL = 96;
const DIRECTION_THRESHOLD = 3;

export function ScrollRevealSearch({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-app-shell-header]");

    const measureHeader = () => {
      if (header) setHeaderHeight(header.offsetHeight);
    };

    measureHeader();

    const readScrollY = () => window.scrollY || document.documentElement.scrollTop;
    lastScrollY.current = readScrollY();

    const handleScroll = () => {
      const currentScrollY = readScrollY();
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY <= SHOW_AFTER_SCROLL) {
        setVisible(false);
      } else if (delta <= -DIRECTION_THRESHOLD) {
        setVisible(true);
      } else if (delta >= DIRECTION_THRESHOLD) {
        setVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", measureHeader);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", measureHeader);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      data-scroll-reveal-search
      className="fixed inset-x-0 top-16 z-20 border-b border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur-sm sm:top-20 sm:px-4 lg:px-6"
      style={headerHeight ? { top: `${headerHeight}px` } : undefined}
    >
      <div className="mx-auto w-full max-w-[1500px]">{children}</div>
    </div>
  );
}
