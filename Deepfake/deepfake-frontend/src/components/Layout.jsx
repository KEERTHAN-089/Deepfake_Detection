import React from "react";
import Navbar from "./Navbar";
import { Card } from "./ui";
import { cn } from "../lib/cn";

function Footer() {
  return (
    <footer className="border-t border-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} DeepScan</p>
        <p>Results are probabilistic. Verify important content with other sources.</p>
      </div>
    </footer>
  );
}

export function AppLayout({ children, className }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className={cn("mx-auto w-full max-w-6xl flex-1 animate-fade-in px-4 py-10 sm:px-6 lg:px-8", className)}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function AuthLayout({ title, subtitle, icon: Icon, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:items-center">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 text-center">
            {Icon && (
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/25">
                <Icon className="h-5 w-5 text-violet-300" aria-hidden="true" />
              </div>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>}
          </div>
          <Card className="p-6 sm:p-8">{children}</Card>
          {footer && <div className="mt-6 text-center text-sm text-zinc-400">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
