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
  display_name?: string;
  phone?: string;
  date_of_birth?: string | null;
  about?: string;
  avatar_url?: string;
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

export interface ProfileResponse {
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
    const firstError =
      data?.access_code?.[0] ||
      data?.email?.[0] ||
      data?.password?.[0] ||
      data?.name?.[0] ||
      data?.non_field_errors?.[0] ||
      data?.detail ||
      data?.error ||
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

  profile: {
    /** Fetch full profile by user id. */
    get: (id: number) =>
      request<UserDetails>(`/user-details/${id}/profile/`),

    /** Update editable profile fields (partial PATCH). */
    update: (id: number, data: Partial<Omit<UserDetails, "id" | "email" | "access_code" | "created_at" | "updated_at">>) =>
      request<ProfileResponse>(`/user-details/${id}/profile/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    /** Generate a new access code — old one becomes invalid. */
    resetCode: (id: number) =>
      request<{ message: string; access_code: string; user: UserDetails }>(`/user-details/${id}/reset-code/`, {
        method: "POST",
      }),
  },
};
