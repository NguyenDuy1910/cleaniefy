"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="app-error-state">
          <span className="app-error-icon"><TriangleAlert size={22} /></span>
          <div><p className="eyebrow">A short interruption</p><h1>We couldn&apos;t load that page.</h1><p>Please try again. Your saved work is safe.</p></div>
          <button className="button" type="button" onClick={reset}><RefreshCw size={16} /> Try again</button>
        </main>
      </body>
    </html>
  );
}
