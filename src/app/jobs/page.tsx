// frontend/src/app/jobs/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../lib/api";
import JobStatus from "../../components/JobStatus";

type JobRow = {
  id: string;
  type: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "DEAD";
  attempts?: number;
  last_error?: string | null;
  updated_at?: string;
};

function isAdmin(roles: string[]) {
  return roles.includes("ADMIN");
}

export default function JobsPage() {
  const { data: session, status }: any = useSession();
  const roles: string[] = session?.roles ?? [];
  const allowed = isAdmin(roles);

  const [jobId, setJobId] = useState<string>("");

  // NOTE: backend currently supports GET /jobs/{id}. For an admin list, we’ll
  // query a lightweight “recent jobs” endpoint. Add it below in backend.
  const recent = useQuery({
    queryKey: ["jobs", "recent"],
    queryFn: () => apiGet<{ data: JobRow[] }>("/jobs?limit=25"),
    enabled: status === "authenticated" && allowed,
    refetchInterval: 3000,
  });

  const rows = useMemo(() => recent.data?.data ?? [], [recent.data]);

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (!allowed) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold">Jobs</h1>
        <p className="mt-2 text-sm text-gray-600">
          You don’t have permission to view jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">Jobs</h1>
      <p className="text-sm text-gray-600 mt-1">
        Admin view of recent background jobs (tenant-scoped).
      </p>

      <div className="mt-6 border rounded p-4">
        <div className="font-medium">Lookup by Job ID</div>
        <div className="mt-2 flex gap-2">
          <input
            className="flex-1 border p-2 rounded font-mono text-sm"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="paste job id..."
          />
        </div>
        {jobId ? (
          <div className="mt-3">
            <JobStatus jobId={jobId} />
          </div>
        ) : null}
      </div>

      <div className="mt-6 border rounded p-4">
        <div className="font-medium">Recent jobs</div>
        {recent.isLoading ? (
          <p className="mt-2 text-sm">Loading...</p>
        ) : recent.error ? (
          <p className="mt-2 text-sm text-red-600">
            Failed to load jobs: {(recent.error as Error).message}
          </p>
        ) : (
          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Attempts</th>
                  <th className="py-2 pr-4">Updated</th>
                  <th className="py-2 pr-4">Job ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((j) => (
                  <tr key={j.id} className="border-b">
                    <td className="py-2 pr-4">{j.status}</td>
                    <td className="py-2 pr-4">{j.type}</td>
                    <td className="py-2 pr-4">{j.attempts ?? 0}</td>
                    <td className="py-2 pr-4">
                      {j.updated_at ? new Date(j.updated_at).toLocaleString() : ""}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      <button
                        className="underline"
                        onClick={() => setJobId(j.id)}
                        title="Click to inspect"
                      >
                        {j.id}
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td className="py-3 text-sm text-gray-600" colSpan={5}>
                      No jobs yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
