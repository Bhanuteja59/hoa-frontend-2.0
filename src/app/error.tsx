// frontend/src/app/error.tsx
"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-gray-600 mt-1">
        This page encountered an error. Try again. If it keeps happening, capture the details below.
      </p>
      <pre className="mt-4 text-xs bg-gray-50 border rounded p-3 overflow-auto">
{error.message}
{error.digest ? `\n\ndigest: ${error.digest}` : ""}
      </pre>
      <button className="mt-4 border rounded px-3 py-2 hover:bg-gray-50" onClick={() => reset()}>
        Retry
      </button>
    </div>
  );
}
