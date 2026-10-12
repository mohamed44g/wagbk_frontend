"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { axiosInstance, getApiError, getStoredSession, AuthResponse } from "../lib/auth";
import { useToast } from "../components/ToastProvider";

type Enrollment = {
  id: string;
  teacher_name: string;
  group_name: string;
  subject_name_ar: string;
  subject_name_en: string;
  academic_year: number;
  schedule_slots: { day: string; time: string }[];
  center_name: string;
};

type Homework = {
  id: string;
  title: string;
  description: string | null;
  lesson_name: string;
  group_name: string;
  group_id: string;
  subject_id?: string | null;
  subject_name_ar?: string | null;
  subject_name_en?: string | null;
  due_date: string | null;
  submission_status: string | null;
  total_score: number | null;
  max_score: number | null;
  has_essay: boolean;
  is_expired: boolean;
};

const yearLabels: Record<number, string> = {
  1: "أولى ثانوي",
  2: "تانية ثانوي",
  3: "تالتة ثانوي",
};
const dayLabels: Record<string, string> = {
  saturday: "السبت",
  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
};

function formatTime(time: string) {
  const [hoursText, minutes] = time.slice(0, 5).split(":");
  const hours = Number(hoursText);
  return `${hours % 12 || 12}:${minutes} ${hours >= 12 ? "PM" : "AM"}`;
}

function formatDate(date: string | null) {
  if (!date) return "من غير موعد انتهاء";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export default function StudentPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [accessCode, setAccessCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const year = user?.academicYear ?? 1;
  const yearLabel = yearLabels[year];
  const filteredEnrollments = useMemo(
    () => enrollments.filter((item) => item.academic_year === year),
    [enrollments, year],
  );

  const availableSubjects = useMemo(() => {
    const map = new Map<string, string>();
    homeworks.forEach((h) => {
      if (h.subject_name_ar) {
        const key = h.subject_id || h.subject_name_ar;
        map.set(key, h.subject_name_ar);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [homeworks]);

  const filteredHomeworks = useMemo(() => {
    if (selectedSubject === "all") return homeworks;
    return homeworks.filter(
      (h) => h.subject_id === selectedSubject || h.subject_name_ar === selectedSubject,
    );
  }, [homeworks, selectedSubject]);

  async function loadData() {
    const session = getStoredSession();
    if (!session || session.user.role !== "student") {
      router.replace("/login?role=student");
      return;
    }
    setUser(session.user);
    try {
      const [enrollmentsResponse, homeworksResponse] = await Promise.all([
        axiosInstance.get<Enrollment[]>("/enrollments"),
        axiosInstance.get<Homework[]>("/homeworks"),
      ]);
      setEnrollments(enrollmentsResponse.data);
      setHomeworks(homeworksResponse.data);
    } catch (loadError) {
      const message = getApiError(loadError);
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setJoining(true);
    try {
      await axiosInstance.post("/enrollments", { accessCode: accessCode.trim().toUpperCase() });
      setAccessCode("");
      setMessage("تم الانضمام للمجموعة، وبقت ظاهرة في سنة دراستك.");
      showToast({ type: "success", message: "تم الانضمام للمجموعة بنجاح." });
      await loadData();
    } catch (joinError) {
      const message = getApiError(joinError);
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setJoining(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#1F2937]">
      <header className="border-b-2 border-[#DCE4EF] bg-white">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1400px] items-center justify-between gap-6 py-5 max-md:flex-col max-md:items-start max-md:gap-3 lg:w-[calc(100%-6rem)]">
          <Link className="text-[28px] font-black tracking-[-1.5px] text-[#173F5F]" href="/">
            واجبك<span className="text-[#F6C445]">.</span>
          </Link>
          <div className="flex items-center gap-4 text-right max-md:w-full max-md:flex-wrap max-md:justify-between">
            <div className="hidden sm:block">
              <p className="text-[12px] font-bold text-[#6B7280]">أهلاً {user?.name ?? ""}</p>
              <strong className="text-[15px] text-[#173F5F]">{yearLabel}</strong>
            </div>
            <Link
              className="rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-5 py-2.5 text-[13px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F] transition hover:bg-[#F3B926]"
              href="/student/review"
            >
              التقييمات
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1400px] py-12 lg:w-[calc(100%-6rem)]">
        <div className="mb-10 flex items-end justify-between gap-6 max-md:flex-col max-md:items-start">
          <div>
            <p className="mb-3 text-[14px] font-black text-[#20639B]">مساحة مذاكرتك</p>
            <h1 className="text-[clamp(36px,5vw,64px)] font-black leading-[1.1] tracking-[-2px] text-[#173F5F]">
              واجبات {yearLabel}
            </h1>
            <p className="mt-4 text-[16px] text-[#6B7280]">
              كل اللي يخص سنتك الدراسية ظاهر هنا من غير لخبطة.
            </p>
          </div>
          <form className="flex w-full max-w-[440px] gap-3" onSubmit={handleJoin}>
            <input
              className="min-w-0 flex-1 rounded-full border-2 border-[#173F5F] bg-white px-5 py-3 text-[14px] outline-none focus:shadow-[3px_3px_0_#20639B]"
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="ادخل كود المجموعة"
              required
              value={accessCode}
            />
            <button
              className="rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-5 py-3 text-[13px] font-black text-[#173F5F] shadow-[4px_4px_0_#173F5F] disabled:opacity-60"
              disabled={joining}
              type="submit"
            >
              {joining ? "جاري..." : "انضمام"}
            </button>
          </form>
        </div>

        {(message || error) && (
          <p
            className={
              message
                ? "mb-6 rounded-[14px] border-2 border-[#68AB48]/30 bg-[#F0FDF4] px-4 py-3 text-[14px] font-bold text-[#27743A]"
                : "mb-6 rounded-[14px] border-2 border-[#B42318]/25 bg-[#FEF3F2] px-4 py-3 text-[14px] font-bold text-[#B42318]"
            }
          >
            {message || error}
          </p>
        )}

        <section className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
          <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#F6C445] p-6 shadow-[5px_5px_0_#173F5F]">
            <span className="text-[13px] font-black text-[#173F5F]">المجموعات بتاعتك</span>
            <strong className="mt-3 block text-[42px] font-black text-[#173F5F]">
              {filteredEnrollments.length}
            </strong>
          </div>
          <div className="rounded-[24px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#173F5F]">
            <span className="text-[13px] font-black text-[#6B7280]">واجبات السنة</span>
            <strong className="mt-3 block text-[42px] font-black text-[#173F5F]">{homeworks.length}</strong>
          </div>
          <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#173F5F] p-6 shadow-[5px_5px_0_#F6C445]">
            <span className="text-[13px] font-black text-[#B5C9DD]">سنتك الدراسية</span>
            <strong className="mt-3 block text-[30px] font-black text-white">{yearLabel}</strong>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
            <h2 className="text-[28px] font-black text-[#173F5F]">المجموعات المنضم ليها</h2>
            <span className="text-[13px] font-bold text-[#68AB48]">مجموعات {yearLabel}</span>
          </div>
          {loading ? (
            <p className="rounded-[20px] bg-white p-8 text-center text-[#6B7280]">جاري تحميل مجموعاتك...</p>
          ) : filteredEnrollments.length === 0 ? (
            <p className="rounded-[20px] border-2 border-dashed border-[#DCE4EF] bg-white p-10 text-center text-[#6B7280]">
              لسه مفيش مجموعات انضميت ليها في سنتك.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-2 max-md:grid-cols-1">
              {filteredEnrollments.map((enrollment) => (
                <article
                  className="rounded-[22px] border-2 border-[#173F5F] bg-white p-5 shadow-[4px_4px_0_#DCE4EF]"
                  key={enrollment.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#F6C445] px-3 py-1 text-[11px] font-black text-[#173F5F]">
                      {yearLabel}
                    </span>
                    <span className="text-[12px] font-bold text-[#68AB48]">منضم</span>
                  </div>
                  <h3 className="mt-5 text-[22px] font-black text-[#173F5F]">{enrollment.group_name}</h3>
                  <p className="mt-2 text-[14px] font-bold text-[#20639B]">
                    {enrollment.subject_name_ar} - {enrollment.subject_name_en}
                  </p>
                  <div className="mt-4 grid gap-2 text-[12px] text-[#6B7280]">
                    <p>
                      المدرس: <strong className="text-[#173F5F]">{enrollment.teacher_name}</strong>
                    </p>
                    <p>
                      السنتر: <strong className="text-[#173F5F]">{enrollment.center_name}</strong>
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {enrollment.schedule_slots.map((slot) => (
                      <span
                        className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[12px] font-bold text-[#20639B]"
                        key={`${slot.day}-${slot.time}`}
                      >
                        {dayLabels[slot.day]} - {formatTime(slot.time)}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-[28px] font-black text-[#173F5F]">واجباتك الحالية</h2>
              <p className="text-[13px] font-bold text-[#6B7280]">فلترة الواجبات حسب المادة الدراسية</p>
            </div>
            {availableSubjects.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubject("all")}
                  className={`rounded-full px-4 py-2 text-[12px] font-black transition cursor-pointer ${
                    selectedSubject === "all"
                      ? "border-2 border-[#173F5F] bg-[#173F5F] text-white shadow-[2px_2px_0_#F6C445]"
                      : "border-2 border-[#173F5F]/20 bg-white text-[#173F5F] hover:bg-[#EFF6FF]"
                  }`}
                >
                  جميع المواد ({homeworks.length})
                </button>
                {availableSubjects.map((subject) => {
                  const count = homeworks.filter(
                    (h) => h.subject_id === subject.id || h.subject_name_ar === subject.name
                  ).length;
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => setSelectedSubject(subject.id)}
                      className={`rounded-full px-4 py-2 text-[12px] font-black transition cursor-pointer ${
                        selectedSubject === subject.id
                          ? "border-2 border-[#173F5F] bg-[#20639B] text-white shadow-[2px_2px_0_#173F5F]"
                          : "border-2 border-[#173F5F]/20 bg-white text-[#173F5F] hover:bg-[#EFF6FF]"
                      }`}
                    >
                      مادة {subject.name} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {loading ? (
            <p className="rounded-[20px] bg-white p-8 text-center text-[#6B7280]">جاري تحميل واجباتك...</p>
          ) : filteredHomeworks.length === 0 ? (
            <p className="rounded-[20px] border-2 border-dashed border-[#DCE4EF] bg-white p-10 text-center text-[#6B7280]">
              {selectedSubject === "all"
                ? "لسه مفيش واجبات منشورة لسنتك."
                : "مفيش واجبات منشورة حالياً في هذه المادة."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
              {filteredHomeworks.map((homework) => {
                const isSubmitted = homework.submission_status === "submitted" || homework.submission_status === "graded";
                const isPendingEssay = homework.submission_status === "submitted" && homework.has_essay;
                const isGraded = homework.submission_status === "graded";

                return (
                  <article
                    className="rounded-[22px] border-2 border-[#173F5F] bg-white p-5 shadow-[4px_4px_0_#DCE4EF] transition hover:-translate-y-1 hover:shadow-[6px_6px_0_#F6C445]"
                    key={homework.id}
                  >
                    <Link className="group block" href={isSubmitted ? `/student/homeworks/${homework.id}` : `/student/homeworks/${homework.id}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {homework.subject_name_ar && (
                            <span className="rounded-full bg-[#173F5F] px-3 py-1 text-[11px] font-black text-white">
                              مادة {homework.subject_name_ar}
                            </span>
                          )}
                          <span className="rounded-full bg-[#F6C445] px-3 py-1 text-[11px] font-black text-[#173F5F]">
                            {homework.lesson_name}
                          </span>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black ${
                          homework.is_expired
                            ? "bg-[#FEE2E2] text-[#B42318]"
                            : isPendingEssay
                              ? "bg-[#FFF4CC] text-[#8A6500]"
                              : isSubmitted
                                ? "bg-[#EAF7E5] text-[#27743A]"
                                : "bg-[#EFF6FF] text-[#20639B]"
                        }`}>
                          {homework.is_expired
                            ? "منتهى"
                            : isPendingEssay
                              ? "التصحيح معلّق"
                              : isGraded
                                ? "تم التصحيح"
                                : isSubmitted
                                  ? "تم التسليم"
                                  : "مطلوب حل"}
                        </span>
                      </div>
                      <h3 className="mt-5 text-[21px] font-black text-[#173F5F]">{homework.title}</h3>
                      <p className="mt-2 text-[13px] text-[#6B7280]">
                        {homework.description ?? "حل الواجب وراجع نتيجتك بعد التسليم."}
                      </p>
                      <p className="mt-5 text-[12px] font-bold text-[#20639B]">المجموعة: {homework.group_name}</p>
                    </Link>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t-2 border-[#DCE4EF] pt-4 text-[12px]">
                      <span className="font-bold text-[#6B7280]">ينتهي: {formatDate(homework.due_date)}</span>
                      {homework.is_expired ? (
                        <span className="rounded-full bg-[#FEE2E2] px-3 py-2 font-black text-[#B42318]">انتهى الموعد</span>
                      ) : isPendingEssay ? (
                        <Link
                          className="rounded-full bg-[#FFF4CC] px-3 py-2 font-black text-[#8A6500] transition hover:bg-[#FFE9A3]"
                          href={`/student/homeworks/${homework.id}`}
                        >
                          التصحيح معلّق
                        </Link>
                      ) : isSubmitted ? (
                        <Link
                          className="rounded-full bg-[#EFF6FF] px-4 py-2 font-black text-[#20639B] transition hover:bg-[#DCEBFA]"
                          href={`/student/review?homeworkId=${homework.id}`}
                        >
                          راجع التقييم والأخطاء ↵
                        </Link>
                      ) : (
                        <Link className="font-black text-[#20639B] transition hover:text-[#68AB48]" href={`/student/homeworks/${homework.id}`}>
                          افتح الواجب ←
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <footer className="mt-16 border-t-2 border-[#DCE4EF] bg-white py-8">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1400px] items-center justify-between gap-4 max-sm:flex-col lg:w-[calc(100%-6rem)]">
          <p className="text-[13px] font-bold text-[#6B7280]">منصة واجبك © 2026 - جميع الحقوق محفوظة</p>
          <button
            className="rounded-full border-2 border-[#173F5F] bg-[#FEF2F2] px-6 py-2.5 text-[13px] font-black text-[#B42318] shadow-[3px_3px_0_#B42318] transition hover:bg-[#FEE2E2] cursor-pointer"
            onClick={() => {
              window.localStorage.clear();
              router.push("/login?role=student");
            }}
            type="button"
          >
            تسجيل الخروج
          </button>
        </div>
      </footer>
    </main>
  );
}
