import { ReactNode } from "react";
import { SiteHeader, SiteFooter } from "./SiteChrome";

export function PageShell({ children, withFooter = true }: { children: ReactNode; withFooter?: boolean }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main>{children}</main>
      {withFooter && <SiteFooter />}
    </div>
  );
}
