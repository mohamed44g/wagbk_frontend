"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/AuthShell";
import {
  axiosInstance,
  AuthResponse,
  getApiError,
  saveAuthSession,
} from "../../lib/auth";
import { useToast } from "../../components/ToastProvider";

const inputClass =
  "mt-2 w-full rounded-[14px] border-2 border-[#DCE4EF] bg-white px-4 py-3.5 text-[15px] text-[#173F5F] outline-none transition placeholder:text-[#9AA8B8] focus:border-[#20639B] focus:shadow-[3px_3px_0_#20639B]";

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { data } = await axiosInstance.post<AuthResponse>("/sessions", {
        phone: email,
        password,
        role: "super_admin",
      });
      saveAuthSession(data);
      showToast({ type: "success", message: "تم تسجيل دخول الأدمن بنجاح." });
      router.push("/admin");
    } catch (submitError) {
      const message = getApiError(submitError);
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      description="سجل دخولك للوصول إلى إدارة المنصة ومتابعة كل البيانات من مكان واحد."
      eyebrow="دخول الإدارة"
      footerHref="/login"
      footerLabel="تسجيل دخول الطالب أو المدرس"
      footerText="عايز تدخل بحساب عادي؟"
      title="أهلًا بيك يا أدمن."
    >
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <label className="text-[14px] font-black text-[#173F5F]">
          البريد الإلكتروني
          <input
            className={inputClass}
            autoComplete="username"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="text-[14px] font-black text-[#173F5F]">
          كلمة السر
          <input
            className={inputClass}
            autoComplete="current-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="ادخل كلمة السر"
            required
            type="password"
            value={password}
          />
        </label>

        {error && (
          <p className="rounded-[12px] border-2 border-[#B42318]/25 bg-[#FEF3F2] px-4 py-3 text-[13px] font-bold leading-[1.7] text-[#B42318]" role="alert">
            {error}
          </p>
        )}

        <button className="mt-1 inline-flex items-center justify-center rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-6 py-3.5 text-[15px] font-black text-[#173F5F] shadow-[4px_4px_0_#173F5F] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#173F5F] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
          {isSubmitting ? "جاري تسجيل الدخول..." : "دخول لوحة الإدارة"}
        </button>
      </form>
    </AuthShell>
  );
}
