import type { ReactNode } from "react";

export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full max-w-[480px] mx-auto bg-background">
      {children}
    </div>
  );
}