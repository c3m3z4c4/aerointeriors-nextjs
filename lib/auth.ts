"use client";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ais-token");
}

export function setToken(token: string) {
  localStorage.setItem("ais-token", token);
}

export function clearToken() {
  localStorage.removeItem("ais-token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
