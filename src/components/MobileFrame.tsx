import type { ReactNode } from "react";

export function MobileFrame({ children }: { children: ReactNode }) {
  // Real mobile-app feel: full-viewport container, no iPhone chrome.
  return (
    <div className="relative min-h-screen w-full max-w-[480px] mx-auto bg-background overflow-x-hidden">
      {children}
    </div>
  );
}