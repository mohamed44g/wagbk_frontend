"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../components/AuthShell";
import {
  AuthRole,
  AuthResponse,
  axiosInstance,
  getApiError,
  saveAuthSession,
} from "../lib/auth";
import { useToast } from "../components/ToastProvider";

const inputClass =
  "mt-2 w-full rounded-[14px] border-2 border-[#DCE4EF] bg-white px-4 py-3.5 text-[15px] text-[#173F5F] outline-none transition placeholder:text-[#9AA8B8] focus:border-[#20639B] focus:shadow-[3px_3px_0_#20639B]";

function roleClass(active: boolean) {
  return active
    ? "rounded-[14px] border-2 border-[#173F5F] bg-[#F6C445] px-4 py-3 text-[14px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F]"
    : "rounded-[14px] border-2 border-[#DCE4EF] bg-white px-4 py-3 text-[14px] font-black text-[#6B7280] transition hover:border-[#20639B]";
}

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [role, setRole] = useState<AuthRole>("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { data } = await axiosInstance.post<AuthResponse>("/sessions", {
        phone: identifier,
        password,
        role,
      });
      saveAuthSession(data);
      showToast({ type: "success", message: "تم تسجيل الدخول بنجاح." });
      router.push(
        data.user.role === "student"
          ? "/student"
          : data.user.role === "teacher"
            ? "/teacher"
            : "/admin",
      );
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
      description="ادخل حسابك وكمل مشوارك من آخر مكان وقفت عنده."
      eyebrow="نورتنا"
      footerHref="/register"
      footerLabel="أنشئ حساب جديد"
      footerText="مالكش حساب؟"
      title="اهلا بيك تاني."
    >
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div>
          <span className="text-[14px] font-black text-[#173F5F]">انت داخل بصفتك ايه؟</span>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <button className={roleClass(role === "student")} onClick={() => setRole("student")} type="button">طالب</button>
            <button className={roleClass(role === "teacher")} onClick={() => setRole("teacher")} type="button">مدرس</button>
            <button className={roleClass(role === "super_admin")} onClick={() => setRole("super_admin")} type="button">أدمن</button>
          </div>
        </div>

        <label className="text-[14px] font-black text-[#173F5F]">
          {role === "super_admin" ? "البريد الإلكتروني" : "رقم الموبايل"}
          <input
            className={inputClass}
            inputMode={role === "super_admin" ? "email" : "tel"}
            name="identifier"
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={role === "super_admin" ? "admin@example.com" : "01012345678"}
            required
            type={role === "super_admin" ? "email" : "tel"}
            value={identifier}
          />
        </label>

        <label className="text-[14px] font-black text-[#173F5F]">
          كلمة السر
          <input className={inputClass} minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} placeholder="ادخل كلمة السر" required type="password" value={password} />
        </label>

        {error && <p className="rounded-[12px] border-2 border-[#B42318]/25 bg-[#FEF3F2] px-4 py-3 text-[13px] font-bold leading-[1.7] text-[#B42318]" role="alert">{error}</p>}

        <button className="mt-1 inline-flex items-center justify-center rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-6 py-3.5 text-[15px] font-black text-[#173F5F] shadow-[4px_4px_0_#173F5F] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#173F5F] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
          {isSubmitting ? "جاري تسجيل الدخول..." : "ادخل حسابي"}
        </button>
      </form>
    </AuthShell>
  );
}
