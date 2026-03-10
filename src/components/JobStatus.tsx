// frontend/src/components/JobStatus.tsx
"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";

type Job = {
  id: string;
  type: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "DEAD";
  attempts?: number;
  last_error?: string | null;
  updated_at?: string;
};

export default function JobStatus({ jobId }: { jobId: string }) {
  const q = useQuery<{ data: Job | null }>({
    queryKey: ["job", jobId],
    queryFn: () => apiGet<{ data: Job | null }>(`/jobs/${encodeURIComponent(jobId)}`),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      const st = data.data?.status;
      if (!st) return 2000;
      return st === "SUCCEEDED" || st === "DEAD" ? false : 1500;
    },
  });

  useEffect(() => {
    // Start polling immediately
    q.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const job = q.data?.data;
  if (!job) return <div className="text-sm text-gray-600">Job not found.</div>;

  const badge =
    job.status === "SUCCEEDED"
      ? "bg-green-100 text-green-800"
      : job.status === "DEAD"
        ? "bg-red-100 text-red-800"
        : job.status === "RUNNING"
          ? "bg-blue-100 text-blue-800"
          : "bg-gray-100 text-gray-800";

  return (
    <div className="border rounded p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="font-medium">Ingestion Job</span>{" "}
          <span className="font-mono text-xs text-gray-600">{job.id}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${badge}`}>{job.status}</span>
      </div>

      <div className="mt-2 text-xs text-gray-600">
        type: {job.type} • attempts: {job.attempts ?? 0}
        {job.updated_at ? ` • updated: ${new Date(job.updated_at).toLocaleString()}` : null}
      </div>

      {job.status === "DEAD" && job.last_error ? (
        <pre className="mt-3 text-xs bg-red-50 border border-red-200 p-2 rounded overflow-auto">
          {job.last_error}
        </pre>
      ) : null}
    </div>
  );
}
