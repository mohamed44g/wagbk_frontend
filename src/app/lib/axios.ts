import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("homework_access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join("، ");
    if (typeof message === "string") return message;
  }

  if (error instanceof Error) return error.message;
  return "حصل خطأ غير متوقع، حاول تاني.";
}
