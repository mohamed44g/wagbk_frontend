"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthResponse, axiosInstance, getApiError, getStoredSession } from "../lib/auth";
import { useToast } from "./ToastProvider";

export type WeeklyEvaluationAudience = "student" | "teacher";

type WeeklyRow = {
  label: string;
  weekStart: string;
  rating: number;
  completionRate: number;
  averageScore: number;
  submittedCount: number;
  gradedCount: number;
  availableCount?: number;
  assignedCount?: number;
  expectedCount?: number;
  gradingRate?: number;
};

type WeeklySummary = {
  currentRating: number;
  averageRating: number;
  ratingChange: number;
  currentWeekLabel: string;
  completionRate: number;
  averageScore: number;
  submittedCount: number;
  gradedCount: number;
  availableCount?: number;
  assignedCount?: number;
  expectedCount?: number;
  gradingRate?: number;
};

type WeeklyEvaluationResponse = {
  audience: WeeklyEvaluationAudience;
  summary: WeeklySummary;
  weeklyTrend: WeeklyRow[];
};

const labels = {
  student: {
    role: "للطالب",
    eyebrow: "مساحتك الأسبوعية",
    title: "اعرف مستواك واتقدم كل أسبوع.",
    description: "تقييم بسيط يجمع التزامك بالتسليم ومتوسط درجاتك عشان تعرف خطوتك الجاية بوضوح.",
    dashboard: "لوحة الطالب",
    scoreLabel: "متوسط درجاتك",
    completionLabel: "التزامك بالتسليم",
    formulaTitle: "تقييمك بيتحسب إزاي؟",
    formulaDescription: "التقييم الأسبوعي بيجمع بين التزامك بالتسليم وجودة إجاباتك.",
    formulaItems: ["40% الالتزام بتسليم الواجبات", "60% متوسط الدرجات بعد التصحيح"],
    countLabel: "واجب متاح",
    action: "العودة لواجباتي",
    actionHref: "/student",
  },
  teacher: {
    role: "للمدرس",
    eyebrow: "متابعة مجموعاتك",
    title: "تابع الأداء واهتم بالطالب.",
    description: "تقييم أسبوعي يوضح نسبة التسليم وسرعة التصحيح ومتوسط أداء طلابك عشان تعرف مين محتاج دعم.",
    dashboard: "لوحة المدرس",
    scoreLabel: "متوسط أداء الطلاب",
    completionLabel: "نسبة التسليم",
    formulaTitle: "تقييمك بيتحسب إزاي؟",
    formulaDescription: "التقييم الأسبوعي بيقيس المتابعة الفعلية للمجموعة وجودة التصحيح.",
    formulaItems: ["30% متابعة وتسليم الطلاب", "30% سرعة تصحيح الإجابات", "40% متوسط أداء الطلاب"],
    countLabel: "واجب منشور",
    action: "العودة لمجموعاتي",
    actionHref: "/teacher",
  },
} as const;

function ratingName(rating: number) {
  if (rating >= 85) return "ممتاز";
  if (rating >= 70) return "قوي";
  if (rating >= 50) return "في تحسن";
  return "محتاج تركيز";
}

function percentage(value: number) {
  return `${Math.round(value)}%`;
}

export default function WeeklyEvaluationPage({ audience }: { audience: WeeklyEvaluationAudience }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [data, setData] = useState<WeeklyEvaluationResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const content = labels[audience];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const session = getStoredSession();
      if (!session || session.user.role !== audience) {
        router.replace(`/login?role=${audience}`);
        return;
      }

      setUser(session.user);
      void (async () => {
        try {
          const endpoint = audience === "student"
            ? `/students/${session.user.id}/weekly-evaluations`
            : `/teachers/${session.user.id}/weekly-evaluations`;
          const response = await axiosInstance.get<WeeklyEvaluationResponse>(endpoint);
          setData(response.data);
        } catch (loadError) {
          const message = getApiError(loadError);
          setError(message);
          showToast({ type: "error", message });
        } finally {
          setLoading(false);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [audience, router, showToast]);

  const maxRating = useMemo(
    () => Math.max(100, ...(data?.weeklyTrend.map((item) => item.rating) ?? [100])),
    [data],
  );
  const current = data?.summary;
  const changeText = current && current.ratingChange >= 0
    ? `+${current.ratingChange}% عن الأسبوع اللي فات`
    : `${current?.ratingChange ?? 0}% عن الأسبوع اللي فات`;

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#1F2937]">
      <header className="border-b-2 border-[#DCE4EF] bg-white">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1400px] items-center justify-between gap-5 py-5 lg:w-[calc(100%-6rem)]">
          <Link className="text-[28px] font-black tracking-[-1.5px] text-[#173F5F]" href={content.actionHref}>
            واجبك<span className="text-[#F6C445]">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[12px] font-bold text-[#6B7280]">أهلاً {user?.name ?? ""}</p>
              <strong className="text-[15px] text-[#173F5F]">{content.dashboard}</strong>
            </div>
            <Link className="rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-4 py-2 text-[12px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F]" href={content.actionHref}>
              {content.action}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1400px] py-12 lg:w-[calc(100%-6rem)]">
        <section className="grid grid-cols-[1fr_auto] items-end gap-8 max-lg:grid-cols-1" data-aos="fade-up">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 text-[14px] font-black text-[#20639B]">
              <span className="size-[9px] rounded-full bg-[#F6C445] shadow-[0_0_0_4px_rgba(246,196,69,.24)]" />
              {content.eyebrow}
            </p>
            <h1 className="max-w-[760px] text-[clamp(38px,5.5vw,72px)] font-black leading-[1.08] tracking-[-2.5px] text-[#173F5F]">
              {content.title}
            </h1>
            <p className="mt-5 max-w-[680px] text-[17px] leading-[1.9] text-[#6B7280]">{content.description}</p>
          </div>
          <div className="relative hidden size-[145px] place-items-center rounded-[42%_58%_48%_52%] border-2 border-[#173F5F] bg-[#F6C445] shadow-[7px_7px_0_#173F5F] lg:grid">
            <span className="text-center text-[16px] font-black leading-[1.5] text-[#173F5F]">كل أسبوع<br />خطوة أوضح</span>
            <span className="absolute -right-3 -top-3 size-6 rotate-45 rounded-[6px] bg-[#68AB48]" />
          </div>
        </section>

        {error && <p className="mt-8 rounded-[16px] border-2 border-[#B42318]/25 bg-[#FEF3F2] px-4 py-3 text-[14px] font-bold text-[#B42318]">{error}</p>}

        {loading ? (
          <section className="mt-10 rounded-[26px] border-2 border-[#173F5F] bg-white p-10 text-center text-[15px] font-bold text-[#6B7280] shadow-[5px_5px_0_#DCE4EF]">
            بنحسب تقييم الأسبوع...
          </section>
        ) : data ? (
          <>
            <section className="mt-10 grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-md:grid-cols-1">
              <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#F6C445] p-5 shadow-[5px_5px_0_#173F5F]" data-aos="fade-up">
                <span className="text-[12px] font-black text-[#173F5F]">تقييم الأسبوع الحالي</span>
                <strong className="mt-3 block text-[44px] font-black leading-none text-[#173F5F]">{percentage(current?.currentRating ?? 0)}</strong>
                <span className="mt-2 block text-[12px] font-bold text-[#173F5F]">{ratingName(current?.currentRating ?? 0)}</span>
              </div>
              <div className="rounded-[24px] border-2 border-[#173F5F] bg-white p-5 shadow-[5px_5px_0_#DCE4EF]" data-aos="fade-up" data-aos-delay="80">
                <span className="text-[12px] font-black text-[#6B7280]">متوسط الأسابيع المسجلة</span>
                <strong className="mt-3 block text-[44px] font-black leading-none text-[#173F5F]">{percentage(current?.averageRating ?? 0)}</strong>
                <span className={`mt-2 block text-[12px] font-black ${(current?.ratingChange ?? 0) >= 0 ? "text-[#68AB48]" : "text-[#B42318]"}`}>{changeText}</span>
              </div>
              <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#173F5F] p-5 text-white shadow-[5px_5px_0_#F6C445]" data-aos="fade-up" data-aos-delay="160">
                <span className="text-[12px] font-black text-[#B5C9DD]">{content.completionLabel}</span>
                <strong className="mt-3 block text-[44px] font-black leading-none text-white">{percentage(current?.completionRate ?? 0)}</strong>
                <span className="mt-2 block text-[12px] font-bold text-[#D7E4F0]">{current?.submittedCount ?? 0} تم تسليمهم</span>
              </div>
              <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#EAF7E5] p-5 shadow-[5px_5px_0_#68AB48]" data-aos="fade-up" data-aos-delay="240">
                <span className="text-[12px] font-black text-[#27743A]">{content.scoreLabel}</span>
                <strong className="mt-3 block text-[44px] font-black leading-none text-[#27743A]">{percentage(current?.averageScore ?? 0)}</strong>
                <span className="mt-2 block text-[12px] font-bold text-[#27743A]/75">{current?.gradedCount ?? 0} تم تصحيحهم</span>
              </div>
            </section>

            <section className="mt-8 grid grid-cols-[1.35fr_.65fr] gap-6 max-lg:grid-cols-1">
              <article className="rounded-[26px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#DCE4EF]" data-aos="fade-left">
                <div className="flex items-center justify-between gap-4 border-b-2 border-[#DCE4EF] pb-5">
                  <div><p className="text-[12px] font-bold text-[#6B7280]">تطور التقييم</p><h2 className="mt-1 text-[26px] font-black text-[#173F5F]">الأسابيع المسجلة</h2></div>
                  <span className="rounded-full bg-[#EFF6FF] px-3 py-2 text-[11px] font-black text-[#20639B]">الأسبوع الحالي: {current?.currentWeekLabel}</span>
                </div>
                <div className="mt-8 flex h-[240px] items-end gap-3 border-b-2 border-[#DCE4EF] px-2 max-sm:gap-1">
                  {data.weeklyTrend.map((item, index) => (
                    <div className="flex h-full flex-1 flex-col items-center justify-end gap-3" key={item.weekStart}>
                      <span className="text-[11px] font-black text-[#173F5F]">{item.rating}%</span>
                      <div className="flex h-[180px] w-full items-end justify-center"><div className={`w-full max-w-[48px] rounded-t-[14px] transition-all ${index === data.weeklyTrend.length - 1 ? "bg-[#F6C445]" : "bg-[#20639B]"}`} style={{ height: `${Math.max(8, (item.rating / maxRating) * 100)}%` }} /></div>
                      <span className="text-[11px] font-bold text-[#6B7280]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[26px] border-2 border-[#173F5F] bg-[#FFF9E8] p-6 shadow-[5px_5px_0_#F6C445]" data-aos="fade-right">
                <p className="text-[12px] font-black text-[#8A6500]">{content.role}</p>
                <h2 className="mt-2 text-[25px] font-black text-[#173F5F]">{content.formulaTitle}</h2>
                <p className="mt-3 text-[13px] leading-[1.8] text-[#6B7280]">{content.formulaDescription}</p>
                <div className="mt-6 grid gap-3">
                  {content.formulaItems.map((item, index) => <div className="flex items-center gap-3 rounded-[15px] border border-[#F6C445] bg-white px-3 py-3 text-[12px] font-black text-[#173F5F]" key={item}><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#F6C445] text-[11px]">0{index + 1}</span>{item}</div>)}
                </div>
                <div className="mt-6 rounded-[18px] border-2 border-[#173F5F] bg-[#173F5F] p-4 text-white"><span className="text-[11px] font-bold text-[#B5C9DD]">{content.countLabel}</span><strong className="mt-1 block text-[34px] font-black">{audience === "student" ? current?.availableCount ?? 0 : current?.assignedCount ?? 0}</strong></div>
              </article>
            </section>

            <section className="mt-8 rounded-[26px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#DCE4EF]" data-aos="fade-up">
              <div className="flex items-center justify-between gap-4"><div><p className="text-[12px] font-bold text-[#6B7280]">صورة سريعة</p><h2 className="mt-1 text-[26px] font-black text-[#173F5F]">تفاصيل كل أسبوع</h2></div><span className="text-[12px] font-bold text-[#68AB48]">البيانات بتتحدث تلقائيًا</span></div>
              <div className="mt-6 grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
                {data.weeklyTrend.map((item) => (
                  <article className="rounded-[19px] border-2 border-[#DCE4EF] bg-[#F7F9FC] p-4" key={`detail-${item.weekStart}`}>
                    <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-[#F6C445] px-3 py-1 text-[11px] font-black text-[#173F5F]">{item.label}</span><strong className="text-[22px] font-black text-[#173F5F]">{item.rating}%</strong></div>
                    <div className="mt-4 h-2 rounded-full bg-[#DCE4EF]"><div className={`h-full rounded-full ${item.rating >= 70 ? "bg-[#68AB48]" : "bg-[#F6C445]"}`} style={{ width: `${Math.max(4, item.rating)}%` }} /></div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-bold text-[#6B7280]"><span>التسليم: <b className="text-[#20639B]">{percentage(item.completionRate)}</b></span><span>الدرجات: <b className="text-[#20639B]">{percentage(item.averageScore)}</b></span>{audience === "teacher" && <span>التصحيح: <b className="text-[#68AB48]">{percentage(item.gradingRate ?? 0)}</b></span>}<span>تم الحل: <b className="text-[#173F5F]">{item.submittedCount}</b></span></div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
