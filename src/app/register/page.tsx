"use client";

import { FormEvent, useEffect, useState } from "react";
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

type SubjectOption = { id: string; nameAr: string; nameEn: string };

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [role, setRole] = useState<AuthRole>("student");
  const [academicYear, setAcademicYear] = useState(1);
  const [academicYears, setAcademicYears] = useState<number[]>([1]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void axiosInstance
        .get<SubjectOption[]>("/subjects")
        .then(({ data }) => setSubjects(data));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (role === "teacher" && academicYears.length === 0) {
      const message = "اختار سنة واحدة على الأقل للتدريس.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }
    if (role === "teacher" && selectedSubjectIds.length === 0) {
      const message = "اختار مادة واحدة على الأقل للتدريس.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }
    if (password !== confirmPassword) {
      const message = "كلمتا السر مش متطابقين.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }
    if (role === "student" && phone === parentPhone) {
      const message = "رقم ولي الأمر لازم يكون مختلف عن رقم الطالب.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = role === "teacher" ? "teachers" : "students";
      const body = role === "teacher"
        ? { name, phone, password, academicYears, subjectIds: selectedSubjectIds }
        : { name, phone, parentPhone, password, academicYear };
      const { data } = await axiosInstance.post<AuthResponse>(`/${endpoint}`, body);
      saveAuthSession(data);
      showToast({ type: "success", message: "اتعمل حسابك بنجاح، نورت واجبك." });
      router.push(data.user.role === "student" ? "/student" : "/teacher");
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
      description={"اختار دورك وابدأ تجربة أوضح في إدارة الواجبات."}
      eyebrow={"خطوتك الأولى"}
      footerHref="/login"
      footerLabel={"ادخل حسابك"}
      footerText={"عندك حساب بفعل؟"}
      title={"اعمل حسابك بسهولة."}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div>
          <span className="text-[14px] font-black text-[#173F5F]">انت هتسجل كمين؟</span>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button className={roleClass(role === "student")} onClick={() => setRole("student")} type="button">طالب</button>
            <button className={roleClass(role === "teacher")} onClick={() => setRole("teacher")} type="button">مدرس</button>
          </div>
        </div>

        {role === "student" ? (
          <label className="text-[14px] font-black text-[#173F5F]">
            السنة الدراسية
            <select className={inputClass} name="academicYear" onChange={(event) => setAcademicYear(Number(event.target.value))} value={academicYear}>
              <option value={1}>1 - أولى ثانوي</option>
              <option value={2}>2 - تانية ثانوي</option>
              <option value={3}>3 - ثالثة ثانوي</option>
            </select>
          </label>
        ) : (
          <div>
            <span className="text-[14px] font-black text-[#173F5F]">انت بتدرس أي سنين؟</span>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((year) => {
                const selected = academicYears.includes(year);
                return (
                  <button className={roleClass(selected)} key={year} onClick={() => setAcademicYears((current) => selected ? current.filter((item) => item !== year) : [...current, year].sort())} type="button">
                    {year === 1 ? "أولى" : year === 2 ? "تانية" : "ثالثة"}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] text-[#6B7280]">يمكنك اختيار سنة أو أكتر.</p>
          </div>
        )}

        <label className="text-[14px] font-black text-[#173F5F]">
          الاسم
          <input className={inputClass} minLength={2} name="name" onChange={(event) => setName(event.target.value)} placeholder={"اكتب اسمك الكامل"} required value={name} />
        </label>

        <label className="text-[14px] font-black text-[#173F5F]">
          رقم الموبايل
          <input className={inputClass} inputMode="tel" name="phone" onChange={(event) => setPhone(event.target.value)} placeholder="01012345678" required type="tel" value={phone} />
        </label>

        {role === "student" && (
          <label className="text-[14px] font-black text-[#173F5F]">
            رقم ولي الأمر
            <input className={inputClass} inputMode="tel" name="parentPhone" onChange={(event) => setParentPhone(event.target.value)} placeholder="01123456789" required type="tel" value={parentPhone} />
            <span className="mt-2 block text-[11px] font-medium text-[#6B7280]">لازم يكون مختلف عن رقم الطالب.</span>
          </label>
        )}

        {role === "teacher" && (
          <div>
            <span className="text-[14px] font-black text-[#173F5F]">المواد اللي بتدرسها</span>
            <details className="group relative mt-2">
              <summary className={`${inputClass} flex cursor-pointer list-none items-center justify-between`}>
                <span>{selectedSubjectIds.length ? `تم اختيار ${selectedSubjectIds.length} مادة` : "اختار مادة أو أكتر"}</span>
                <span className="text-[18px] transition group-open:rotate-180">⌄</span>
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-full rounded-[16px] border-2 border-[#173F5F] bg-white p-2 shadow-[4px_4px_0_#173F5F]">
                {subjects.map((subjectOption) => {
                  const selected = selectedSubjectIds.includes(subjectOption.id);
                  return (
                    <button className={`flex w-full items-center justify-between rounded-[12px] px-3 py-3 text-right transition hover:bg-[#F7F9FC] ${selected ? "bg-[#F6C445]/25 text-[#173F5F]" : "text-[#6B7280]"}`} key={subjectOption.id} onClick={() => setSelectedSubjectIds((current) => selected ? current.filter((id) => id !== subjectOption.id) : [...current, subjectOption.id])} type="button">
                      <span><span className="block font-black">{subjectOption.nameAr}</span><span className="mt-1 block text-[11px] font-medium opacity-70">{subjectOption.nameEn}</span></span>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[12px] font-black ${selected ? "border-[#173F5F] bg-[#173F5F] text-white" : "border-[#DCE4EF]"}`}>{selected ? "✓" : ""}</span>
                    </button>
                  );
                })}
                {subjects.length === 0 && <p className="px-3 py-3 text-[12px] text-[#6B7280]">جاري تحميل المواد...</p>}
              </div>
            </details>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <label className="text-[14px] font-black text-[#173F5F]">
            كلمة السر
            <input className={inputClass} minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} placeholder={"كلمة قوية"} required type="password" value={password} />
          </label>
          <label className="text-[14px] font-black text-[#173F5F]">
            تأكيد السر
            <input className={inputClass} minLength={8} name="confirmPassword" onChange={(event) => setConfirmPassword(event.target.value)} placeholder={"اكتبها تاني"} required type="password" value={confirmPassword} />
          </label>
        </div>

        {error && <p className="rounded-[12px] border-2 border-[#B42318]/25 bg-[#FEF3F2] px-4 py-3 text-[13px] font-bold leading-[1.7] text-[#B42318]" role="alert">{error}</p>}

        <button className="mt-1 inline-flex items-center justify-center rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-6 py-3.5 text-[15px] font-black text-[#173F5F] shadow-[4px_4px_0_#173F5F] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#173F5F] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
          {isSubmitting ? "جاري إنشاء الحساب..." : "انشئ حسابي"}
        </button>
      </form>
    </AuthShell>
  );
}
