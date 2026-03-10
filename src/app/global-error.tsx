// frontend/src/app/global-error.tsx
"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="p-6">
          <h1 className="text-lg font-semibold">Application Error</h1>
          <pre className="mt-4 text-xs bg-gray-50 border rounded p-3 overflow-auto">
{error.message}
{error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
          <button className="mt-4 border rounded px-3 py-2 hover:bg-gray-50" onClick={() => reset()}>
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
