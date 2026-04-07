const API_URL = import.meta.env.VITE_API_URL || "";

let authToken: string | null = localStorage.getItem("monitor_token");

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("monitor_token", token);
  } else {
    localStorage.removeItem("monitor_token");
  }
}

export function getToken(): string | null {
  return authToken;
}

export function isAuthenticated(): boolean {
  if (!authToken) return false;
  try {
    const payload = JSON.parse(atob(authToken.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export async function apiFetch<T = any>(
  path: string,
  opts?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts?.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers,
  });

  if (res.status === 401) {
    setToken(null);
    window.location.href = "/login";
    throw new Error("Sessão expirada");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth helpers
export async function login(email: string, password: string) {
  const data = await apiFetch<{ token: string; user: any }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function logout() {
  setToken(null);
}

export async function changePassword(password: string) {
  return apiFetch("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}
