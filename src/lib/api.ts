// frontend/src/lib/api.ts
import { getSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";

export async function getUniversalSession() {
  if (typeof window === "undefined") {
    // Dynamic import to prevent client boundary errors
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("./auth");
    return await getServerSession(authOptions);
  }
  return await getSession();
}

// mocks removed
const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

function devTenantHeaders(): Record<string, string> {
  const t = process.env.NEXT_PUBLIC_DEV_TENANT;
  return t ? { "x-tenant-slug": t } : {};
}

async function handleAuthError(res: Response, path?: string) {
  // Clear session if unauthorized or if auth check endpoint is missing (entity deleted)
  if (res.status === 401 || (res.status === 404 && path?.includes("/auth/me"))) {
    if (typeof window !== "undefined") {
      localStorage.setItem("session_expired", "true");
      await signOut({ callbackUrl: "/login" });
    } else {
      redirect("/login");
    }
    return;
  }

  // Handle cases where the tenant context itself is missing or invalid in a lingering session
  if (res.status === 404) {
    try {
      const clone = res.clone();
      const body = await clone.json();
      if (body.error?.code === "TENANT_NOT_FOUND" || body.error?.code === "USER_NOT_FOUND") {
        if (typeof window !== "undefined") {
          localStorage.setItem("session_expired", "true");
          await signOut({ callbackUrl: "/login" });
        } else {
          redirect("/login");
        }
      }
    } catch {
      // Ignore if not standard error JSON
    }
  }
}

function extractErrorMessage(status: number, text: string): string {
  let errorMessage = `API error: ${status} ${text}`;
  try {
    const parsed = JSON.parse(text);
    if (parsed.error && parsed.error.message) {
      errorMessage = parsed.error.message;
    } else if (parsed.detail) {
      if (Array.isArray(parsed.detail)) {
        errorMessage = parsed.detail.map((e: any) => {
          const loc = e.loc?.[e.loc.length - 1] || "";
          // Convert standard array indices to something readable or pure msg
          const field = isNaN(Number(loc)) ? loc : e.loc?.[e.loc.length - 2] || "Field";
          return field ? `${field}: ${e.msg}` : e.msg;
        }).join(" | ");
      } else {
        errorMessage = String(parsed.detail);
      }
    } else if (parsed.message) {
      errorMessage = parsed.message;
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  return errorMessage;
}

export async function apiGet<T>(path: string): Promise<T> {
  const session: any = await getUniversalSession();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      authorization: `Bearer ${session?.user?.accessToken ?? ""}`,
      ...(session?.user?.tenantId
        ? { "x-tenant-id": session.user.tenantId }
        : session?.user?.isPlatformAdmin
          ? { "x-tenant-id": "00000000-0000-0000-0000-000000000000" }
          : devTenantHeaders()),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    await handleAuthError(res, path);
    const txt = await res.text().catch(() => "");
    throw new Error(extractErrorMessage(res.status, txt));
  }
  return res.json();
}

export async function apiPostJson<T>(path: string, body: unknown): Promise<T> {
  const session: any = await getUniversalSession();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${session?.user?.accessToken ?? ""}`,
      ...(session?.user?.tenantId
        ? { "x-tenant-id": session.user.tenantId }
        : session?.user?.isPlatformAdmin
          ? { "x-tenant-id": "00000000-0000-0000-0000-000000000000" }
          : devTenantHeaders()),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    await handleAuthError(res, path);
    const txt = await res.text().catch(() => "");
    throw new Error(extractErrorMessage(res.status, txt));
  }
  return res.json();
}

export async function apiPutJson<T>(path: string, body: unknown): Promise<T> {
  const session: any = await getUniversalSession();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${session?.user?.accessToken ?? ""}`,
      ...(session?.user?.tenantId
        ? { "x-tenant-id": session.user.tenantId }
        : session?.user?.isPlatformAdmin
          ? { "x-tenant-id": "00000000-0000-0000-0000-000000000000" }
          : devTenantHeaders()),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    await handleAuthError(res, path);
    const txt = await res.text().catch(() => "");
    throw new Error(extractErrorMessage(res.status, txt));
  }
  return res.json();
}

export async function apiPatchJson<T>(path: string, body: unknown): Promise<T> {
  const session: any = await getUniversalSession();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${session?.user?.accessToken ?? ""}`,
      ...(session?.user?.tenantId
        ? { "x-tenant-id": session.user.tenantId }
        : session?.user?.isPlatformAdmin
          ? { "x-tenant-id": "00000000-0000-0000-0000-000000000000" }
          : devTenantHeaders()),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    await handleAuthError(res, path);
    const txt = await res.text().catch(() => "");
    throw new Error(extractErrorMessage(res.status, txt));
  }
  return res.json();
}

export async function apiPostMultipart<T>(path: string, form: FormData): Promise<T> {
  const session: any = await getUniversalSession();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${session?.user?.accessToken ?? ""}`,
      ...(session?.user?.tenantId
        ? { "x-tenant-id": session.user.tenantId }
        : session?.user?.isPlatformAdmin
          ? { "x-tenant-id": "00000000-0000-0000-0000-000000000000" }
          : devTenantHeaders()),
      // NOTE: do not set content-type; browser sets boundary.
    },
    body: form,
  });
  if (!res.ok) {
    await handleAuthError(res, path);
    const txt = await res.text().catch(() => "");
    throw new Error(extractErrorMessage(res.status, txt));
  }
  return res.json();
}

export async function apiPostMultipartWithProgress<T>(
  path: string,
  form: FormData,
  onProgress: (progressEvent: ProgressEvent) => void
): Promise<T> {
  const session: any = await getUniversalSession();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}${path}`);
    xhr.setRequestHeader("authorization", `Bearer ${session?.user?.accessToken ?? ""}`);

    const tenantHeaders = session?.user?.tenantId
      ? { "x-tenant-id": session.user.tenantId }
      : session?.user?.isPlatformAdmin
        ? { "x-tenant-id": "00000000-0000-0000-0000-000000000000" }
        : devTenantHeaders();
    for (const [key, value] of Object.entries(tenantHeaders)) {
      xhr.setRequestHeader(key, String(value));
    }

    xhr.upload.addEventListener("progress", onProgress);

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          // Sometimes successful responses are empty or plain text
          resolve({} as T);
        }
      } else {
        if (xhr.status === 401 || (xhr.status === 404 && path?.includes("/auth/me"))) {
          await handleAuthError(new Response(null, { status: xhr.status }), path);
        }
        reject(new Error(extractErrorMessage(xhr.status, xhr.responseText)));
      }
    };

    xhr.onerror = () => reject(new Error("Network Error"));
    xhr.send(form);
  });
}


export async function apiDelete<T>(path: string): Promise<T> {
  const session: any = await getUniversalSession();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${session?.user?.accessToken ?? ""}`,
      ...(session?.user?.tenantId
        ? { "x-tenant-id": session.user.tenantId }
        : session?.user?.isPlatformAdmin
          ? { "x-tenant-id": "00000000-0000-0000-0000-000000000000" }
          : devTenantHeaders()),
    },
  });
  if (!res.ok) {
    await handleAuthError(res, path);
    const txt = await res.text().catch(() => "");
    throw new Error(extractErrorMessage(res.status, txt));
  }
  return res.json();
}

export async function apiDownload(path: string, filename: string): Promise<void> {
  const session: any = await getUniversalSession();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${session?.user?.accessToken ?? ""}`,
      ...(session?.user?.tenantId
        ? { "x-tenant-id": session.user.tenantId }
        : session?.user?.isPlatformAdmin
          ? { "x-tenant-id": "00000000-0000-0000-0000-000000000000" }
          : devTenantHeaders()),
    },
  });

  if (!res.ok) {
    await handleAuthError(res, path);
    throw new Error(`Download failed: ${res.status}`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}


export const api = {
  get: apiGet,
  post: apiPostJson,
  put: apiPutJson,
  patch: apiPatchJson,
  delete: apiDelete,
  postMultipart: apiPostMultipart,
  postMultipartWithProgress: apiPostMultipartWithProgress,
  download: apiDownload
};
