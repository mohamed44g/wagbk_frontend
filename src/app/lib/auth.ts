export { API_BASE_URL, axiosInstance, getApiError } from "./axios";

export type AuthRole = "student" | "teacher" | "super_admin";

export type AuthResponse = {
  accessToken: string;
  expiresIn: string;
  user: {
    id: string;
    name: string;
    role: AuthRole;
    phone?: string;
    parentPhone?: string | null;
    email?: string;
    academicYear?: number;
    academicYears?: number[];
    subjectIds?: string[];
  };
};

export function saveAuthSession(response: AuthResponse) {
  window.localStorage.setItem("homework_access_token", response.accessToken);
  window.localStorage.setItem("homework_user", JSON.stringify(response.user));
}

export function getStoredSession() {
  const token = window.localStorage.getItem("homework_access_token");
  const rawUser = window.localStorage.getItem("homework_user");
  if (!token || !rawUser) return null;

  try {
    return { token, user: JSON.parse(rawUser) as AuthResponse["user"] };
  } catch {
    return null;
  }
}
