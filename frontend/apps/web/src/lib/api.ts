/**
 * Centralized Django REST API client.
 * All calls to the Django backend (http://127.0.0.1:8000) go through here.
 */

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000") + "/api/auth";

export interface UserDetails {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  message: string;
  user: UserDetails;
}

export interface RegisterResponse {
  message: string;
  user: UserDetails;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const data = await res.json();

  if (!res.ok) {
    // Extract first error message from DRF error response
    const firstError =
      data?.email?.[0] ||
      data?.password?.[0] ||
      data?.name?.[0] ||
      data?.non_field_errors?.[0] ||
      data?.detail ||
      "Request failed";
    throw new Error(firstError);
  }

  return data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginResponse>("/user-details/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),

    register: (name: string, email: string, password: string) =>
      request<RegisterResponse>("/user-details/register/", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),
  },
};
