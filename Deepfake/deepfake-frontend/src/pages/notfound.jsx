import React from "react";
import { ArrowLeft, ScanSearch } from "lucide-react";
import { AppLayout } from "../components/Layout";
import { Button } from "../components/ui";

export default function NotFound() {
  return (
    <AppLayout className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-sm text-violet-400">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Page not found</h1>
      <p className="mt-3 max-w-md text-zinc-400">
        The page you're looking for doesn't exist or has moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/">
          <ScanSearch className="h-4 w-4" aria-hidden="true" />
          Analyze a video
        </Button>
        <Button variant="secondary" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Go back
        </Button>
      </div>
    </AppLayout>
  );
}
