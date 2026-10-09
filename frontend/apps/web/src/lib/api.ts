/**
 * Centralized Django REST API client.
 * All calls to the Django backend (http://127.0.0.1:8000) go through here.
 */

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000") + "/api/auth";

export interface UserDetails {
  id: number;
  name: string;
  email: string;
  access_code: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  message: string;
  user: UserDetails;
}

export interface RegisterResponse {
  message: string;
  access_code: string;
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
      data?.access_code?.[0] ||
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
    /** Sign in using the unique access code generated at registration. */
    login: (accessCode: string) =>
      request<LoginResponse>("/user-details/login/", {
        method: "POST",
        body: JSON.stringify({ access_code: accessCode }),
      }),

    /** Register with name, email, password. Returns the one-time access_code to save. */
    register: (name: string, email: string, password: string) =>
      request<RegisterResponse>("/user-details/register/", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),
  },
};
