"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { axiosInstance, getApiError, getStoredSession } from "../../lib/auth";
import { useToast } from "../../components/ToastProvider";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  XCircle,
  Trophy
} from "lucide-react";

type Submission = {
  id: string;
  homework_id: string;
  title: string;
  lesson_name: string;
  status: string;
  auto_score: number | null;
  manual_score: number | null;
  total_score: number | null;
  max_score: number | null;
  submitted_at: string | null;
  has_essay: boolean;
};
type Mistake = {
  answer_id: string;
  question_id: string;
  question_text: string;
  type: "mcq" | "true_false" | "essay" | string;
  points: number;
  correct_boolean: boolean | null;
  essay_text: string | null;
  selected_boolean: boolean | null;
  selected_choice_id: string | null;
  selected_choice_text: string | null;
  correct_choice_text: string | null;
  score: number | null;
  teacher_feedback: string | null;
  homework_id: string;
  homework_title: string;
  lesson_id: string;
  lesson_name: string;
};

function formatScore(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") return "0";
  const num = Number(val);
  if (isNaN(num)) return "0";
  return Number(num.toFixed(2)).toString();
}

function toNumber(value: number | string | null | undefined) {
  return value === null || value === undefined ? 0 : Number(value);
}

function formatDate(date: string | null) {
  if (!date) return "لم يتم التسليم";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function getAnswerText(mistake: Mistake, correct: boolean) {
  if (mistake.type === "mcq") {
    return correct ? mistake.correct_choice_text ?? "الإجابة الصحيحة غير متاحة" : mistake.selected_choice_text ?? "لم يتم تحديد إجابة";
  }
  if (mistake.type === "true_false") {
    const value = correct ? mistake.correct_boolean : mistake.selected_boolean;
    return value === null || value === undefined ? "غير محدد" : value ? "صح" : "خطأ";
  }
  return correct ? "مراجعة المدرس" : mistake.essay_text ?? "لم تتم الإجابة";
}

export default function StudentReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const homeworkFilter = searchParams.get("homeworkId");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [homeworksCount, setHomeworksCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getStoredSession();
    if (!session || session.user.role !== "student") {
      router.replace("/login?role=student");
      return;
    }

    const loadReview = async () => {
      try {
        const [submissionsResponse, mistakesResponse, homeworksResponse] = await Promise.all([
          axiosInstance.get<Submission[]>("/submissions"),
          axiosInstance.get<Mistake[]>("/mistakes"),
          axiosInstance.get<{ id: string }[]>("/homeworks"),
        ]);
        setSubmissions(submissionsResponse.data);
        setMistakes(mistakesResponse.data);
        setHomeworksCount(homeworksResponse.data.length);
      } catch (loadError) {
        const message = getApiError(loadError);
        setError(message);
        showToast({ type: "error", message });
      } finally {
        setLoading(false);
      }
    };

    void loadReview();
  }, [router, showToast]);

  const completedSubmissions = useMemo(
    () => submissions.filter(
      (submission) =>
        (!homeworkFilter || submission.homework_id === homeworkFilter) &&
        (submission.status === "graded" || (submission.status === "submitted" && !submission.has_essay)),
    ),
    [homeworkFilter, submissions],
  );
  const pendingSubmissions = useMemo(
    () => submissions.filter(
      (submission) =>
        (!homeworkFilter || submission.homework_id === homeworkFilter) &&
        submission.status === "submitted" &&
        submission.has_essay,
    ),
    [homeworkFilter, submissions],
  );
  const evaluatedHomeworkIds = useMemo(
    () => new Set(completedSubmissions.map((submission) => submission.homework_id)),
    [completedSubmissions],
  );
  const filteredMistakes = useMemo(
    () => mistakes.filter(
      (mistake) =>
        (!homeworkFilter || mistake.homework_id === homeworkFilter) &&
        evaluatedHomeworkIds.has(mistake.homework_id),
    ),
    [evaluatedHomeworkIds, homeworkFilter, mistakes],
  );

  const scoreSummary = useMemo(() => {
    const score = completedSubmissions.reduce(
      (total, submission) => total + toNumber(submission.total_score || toNumber(submission.auto_score) + toNumber(submission.manual_score)),
      0,
    );
    const maxScore = completedSubmissions.reduce((total, submission) => total + toNumber(submission.max_score), 0);
    return {
      score,
      maxScore,
      percent: maxScore ? Math.round((score / maxScore) * 100) : 0,
    };
  }, [completedSubmissions]);

  const [expandedLessonNames, setExpandedLessonNames] = useState<string[]>([]);

  const lessonGroups = useMemo(() => {
    type LessonGroup = {
      lesson_name: string;
      mistakes: Mistake[];
      submissionsCount: number;
    };

    const map = new Map<string, LessonGroup>();

    // Collect lessons from completed submissions
    completedSubmissions.forEach((sub) => {
      const name = sub.lesson_name || "درس غير محدد";
      if (!map.has(name)) {
        map.set(name, {
          lesson_name: name,
          mistakes: [],
          submissionsCount: 0,
        });
      }
      map.get(name)!.submissionsCount += 1;
    });

    // Add mistakes to their corresponding lesson
    filteredMistakes.forEach((mistake) => {
      const name = mistake.lesson_name || "درس غير محدد";
      if (!map.has(name)) {
        map.set(name, {
          lesson_name: name,
          mistakes: [],
          submissionsCount: 0,
        });
      }
      const group = map.get(name)!;
      if (!group.mistakes.some((m) => m.answer_id === mistake.answer_id)) {
        group.mistakes.push(mistake);
      }
    });

    const result = Array.from(map.values());

    // Sort: lessons with mistakes first, then by lesson_name
    result.sort((a, b) => {
      if (b.mistakes.length !== a.mistakes.length) {
        return b.mistakes.length - a.mistakes.length;
      }
      return a.lesson_name.localeCompare(b.lesson_name, "ar");
    });

    return result;
  }, [completedSubmissions, filteredMistakes]);

  // Auto-expand lessons that have mistakes when loaded
  useEffect(() => {
    if (lessonGroups.length > 0) {
      const withMistakes = lessonGroups
        .filter((g) => g.mistakes.length > 0)
        .map((g) => g.lesson_name);

      if (withMistakes.length > 0) {
        setExpandedLessonNames(withMistakes);
      } else if (lessonGroups[0]) {
        setExpandedLessonNames([lessonGroups[0].lesson_name]);
      }
    }
  }, [lessonGroups]);

  const toggleLessonExpand = (name: string) => {
    setExpandedLessonNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const expandAllLessons = () => {
    setExpandedLessonNames(lessonGroups.map((g) => g.lesson_name));
  };

  const collapseAllLessons = () => {
    setExpandedLessonNames([]);
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#1F2937]">
      <header className="border-b-2 border-[#DCE4EF] bg-white">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1200px] items-center justify-between gap-6 py-5 max-md:flex-wrap max-md:gap-3 lg:w-[calc(100%-6rem)]">
          <Link className="text-[28px] font-black tracking-[-1.5px] text-[#173F5F]" href="/student">
            واجبك<span className="text-[#F6C445]">.</span>
          </Link>
          <Link
            className="rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-4 py-2 text-[12px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F]"
            href="/student"
          >
            رجوع للواجبات
          </Link>
        </div>
      </header>

      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1200px] py-12 lg:w-[calc(100%-6rem)]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-[14px] font-black text-[#20639B]">
              {homeworkFilter ? "مراجعة واجب محدد" : "تقييماتك ونتائجك"}
            </p>
            <h1 className="text-[clamp(36px,5vw,64px)] font-black leading-[1.1] tracking-[-2px] text-[#173F5F]">
              {homeworkFilter ? "مراجعة الواجب" : "قائمة التقييمات والنتائج"}
            </h1>
            <p className="mt-4 text-[16px] text-[#6B7280]">
              {homeworkFilter
                ? "معاينة تقييم الواجب وأخطائك وتحليلات الأسئلة."
                : "تابع عدد واجباتك، الدرجات المرصودة لكل درس، ومؤشر أداء مستواك."}
            </p>
          </div>
          <Link
            className="rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-5 py-2.5 text-[13px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F] transition hover:bg-[#F3B926]"
            href="/student"
          >
            الرئيسية ←
          </Link>
        </div>

        {error && (
          <p className="mb-6 rounded-[14px] border-2 border-[#B42318]/25 bg-[#FEF3F2] px-4 py-3 text-[14px] font-bold text-[#B42318]">
            {error}
          </p>
        )}

        {loading ? (
          <p className="rounded-[24px] bg-white p-12 text-center text-[#6B7280]">جاري تحميل تقييماتك...</p>
        ) : (
          <>
            {/* Top Stat Summary Cards */}
            <section className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
              <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#F6C445] p-6 shadow-[5px_5px_0_#173F5F]">
                <span className="text-[13px] font-black text-[#173F5F]">إجمالي الواجبات</span>
                <strong className="mt-3 block text-[42px] font-black text-[#173F5F]">{homeworksCount || submissions.length}</strong>
              </div>
              <div className="rounded-[24px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#DCE4EF]">
                <span className="text-[13px] font-black text-[#6B7280]">الواجبات التي حُلت</span>
                <strong className="mt-3 block text-[42px] font-black text-[#173F5F]">
                  {completedSubmissions.length + pendingSubmissions.length}
                </strong>
              </div>
              <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#173F5F] p-6 text-white shadow-[5px_5px_0_#F6C445]">
                <span className="text-[13px] font-black text-[#B5C9DD]">متوسط التقييم والنسبة</span>
                <strong className="mt-3 block text-[38px] font-black">
                  {formatScore(scoreSummary.score)} / {formatScore(scoreSummary.maxScore)} ({scoreSummary.percent}%)
                </strong>
              </div>
            </section>

            {/* Performance Indicator Curve (مؤشر الأداء والتقدم بالدروس) */}
            {completedSubmissions.length > 0 && (
              <section className="mt-10 rounded-[28px] border-2 border-[#173F5F] bg-white p-7 shadow-[6px_6px_0_#173F5F]">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#DCE4EF] pb-4">
                  <div>
                    <span className="rounded-full bg-[#EFF6FF] px-3.5 py-1 text-[11px] font-black text-[#20639B]">تتبع المستوى</span>
                    <h2 className="mt-2 text-[26px] font-black text-[#173F5F]">مؤشر الأداء والتقدم بالدروس 📈</h2>
                    <p className="mt-1 text-[13px] text-[#6B7280]">منحنى درجاتك في كل واجب يرتفع وينخفض بناءً على مستواك بكل درس.</p>
                  </div>
                </div>

                <div className="relative overflow-x-auto py-6">
                  <div className="min-w-[650px]">
                    <div className="relative h-[220px] w-full border-b-2 border-l-2 border-[#DCE4EF] px-8 pt-4">
                      <svg className="h-full w-full overflow-visible">
                        <path
                          d={completedSubmissions.map((sub, index) => {
                            const score = toNumber(sub.total_score || toNumber(sub.auto_score) + toNumber(sub.manual_score));
                            const maxScore = toNumber(sub.max_score) || 1;
                            const percent = Math.min(100, Math.max(0, Math.round((score / maxScore) * 100)));
                            const x = (index / Math.max(1, completedSubmissions.length - 1)) * 100;
                            const y = 100 - percent * 0.8;
                            return `${index === 0 ? "M" : "L"} ${x}% ${y}%`;
                          }).join(" ")}
                          fill="none"
                          stroke="#20639B"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      <div className="absolute inset-0 flex justify-between px-8">
                        {completedSubmissions.map((sub, index) => {
                          const score = toNumber(sub.total_score || toNumber(sub.auto_score) + toNumber(sub.manual_score));
                          const maxScore = toNumber(sub.max_score) || 1;
                          const percent = Math.min(100, Math.max(0, Math.round((score / maxScore) * 100)));
                          const bottomPercent = percent * 0.8;

                          return (
                            <div
                              key={sub.id}
                              className="group absolute flex -translate-x-1/2 flex-col items-center"
                              style={{
                                left: `${completedSubmissions.length === 1 ? 50 : (index / (completedSubmissions.length - 1)) * 100}%`,
                                bottom: `${bottomPercent}%`,
                              }}
                            >
                              <div className="mb-2 rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-2.5 py-0.5 text-[11px] font-black text-[#173F5F] shadow-[2px_2px_0_#173F5F] group-hover:scale-110 transition">
                                {formatScore(score)} / {formatScore(maxScore)}
                              </div>
                              <div className="h-4 w-4 rounded-full border-3 border-[#173F5F] bg-[#20639B] ring-4 ring-[#EFF6FF] group-hover:bg-[#F6C445] transition" />
                              <div className="mt-2 max-w-[90px] text-center text-[10px] font-black text-[#173F5F] truncate" title={sub.lesson_name}>
                                {sub.lesson_name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* List of Evaluated Homeworks with Scores */}
            <section className="mt-12">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-[28px] font-black text-[#173F5F]">درجات الواجبات المحلولة</h2>
                <span className="text-[13px] font-bold text-[#68AB48]">
                  إجمالي التقييم: {formatScore(scoreSummary.score)} من {formatScore(scoreSummary.maxScore)}
                </span>
              </div>
              {completedSubmissions.length === 0 ? (
                <p className="rounded-[20px] border-2 border-dashed border-[#DCE4EF] bg-white p-10 text-center text-[#6B7280]">
                  لسه مفيش واجبات اتصححت بالكامل عشان يظهر تقييمك هنا.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
                  {completedSubmissions.map((submission) => {
                    const score = toNumber(submission.total_score || toNumber(submission.auto_score) + toNumber(submission.manual_score));
                    const maxScore = toNumber(submission.max_score);
                    const percent = maxScore ? Math.round((score / maxScore) * 100) : 0;
                    return (
                      <div
                        className="rounded-[22px] border-2 border-[#173F5F] bg-white p-5 shadow-[4px_4px_0_#DCE4EF] flex flex-col justify-between"
                        key={submission.id}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-black text-[#20639B] border border-[#20639B]/20">
                                {submission.lesson_name}
                              </span>
                              <h3 className="mt-2 text-[21px] font-black text-[#173F5F]">{submission.title}</h3>
                            </div>
                            <div className="text-left">
                              <span className="rounded-full bg-[#173F5F] px-3 py-1 text-[12px] font-black text-[#F6C445]">
                                {percent}%
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3 rounded-[14px] bg-[#F7F9FC] p-3 text-[13px]">
                            <span className="font-bold text-[#6B7280]">درجة الواجب:</span>
                            <strong className="text-[16px] font-black text-[#27743A]">
                              {formatScore(score)} / {formatScore(maxScore)}
                            </strong>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 border-t-2 border-[#DCE4EF] pt-4 text-[12px]">
                          <span className="text-[#6B7280]">{formatDate(submission.submitted_at)}</span>
                          <Link
                            className="rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-4 py-1.5 text-[11px] font-black text-[#173F5F] shadow-[2px_2px_0_#173F5F] hover:bg-[#F3B926] transition"
                            href={`/student/homeworks/${submission.homework_id}`}
                          >
                            عرض أسئلة الواجب ↵
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Mistakes & Admin Question Analysis Section (أخطائي بالدروس مع تحليل الأدمن) */}
            <section className="mt-12">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-[28px] font-black text-[#173F5F]">أخطائي وتحليل الأسئلة حسب الدرس</h2>
                  <p className="mt-1 text-[13px] font-bold text-[#6B7280]">
                    مقسمة حسب كل درس، اضغط على "انتقال للأخطاء" لمعاينة الأخطاء وشرح الأدمن للسؤال.
                  </p>
                </div>
                {lessonGroups.length > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={expandAllLessons}
                      className="rounded-full border border-[#173F5F]/20 bg-white px-3.5 py-1.5 text-[12px] font-black text-[#173F5F] transition hover:bg-[#EFF6FF]"
                    >
                      فتح الكل
                    </button>
                    <button
                      type="button"
                      onClick={collapseAllLessons}
                      className="rounded-full border border-[#173F5F]/20 bg-white px-3.5 py-1.5 text-[12px] font-black text-[#6B7280] transition hover:bg-[#F7F9FC]"
                    >
                      إغلاق الكل
                    </button>
                  </div>
                )}
              </div>

              {lessonGroups.length === 0 ? (
                <div className="rounded-[24px] border-2 border-[#68AB48]/40 bg-[#F0FDF4] p-10 text-center text-[#27743A]">
                  <div className="flex justify-center mb-3">
                    <Trophy className="w-12 h-12 text-[#68AB48]" />
                  </div>
                  <strong className="text-[22px] font-black block mb-1">تمام يا بطل مفيش أخطاء!</strong>
                  <p className="text-[14px]">كمّل بنفس التركيز والتفوق في الواجبات الجاية.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {lessonGroups.map((group) => {
                    const hasMistakes = group.mistakes.length > 0;
                    const isExpanded = expandedLessonNames.includes(group.lesson_name);

                    return (
                      <div
                        key={group.lesson_name}
                        className={`rounded-[24px] border-2 transition-all ${
                          hasMistakes
                            ? "border-[#173F5F] bg-white shadow-[4px_4px_0_#173F5F]"
                            : "border-[#68AB48]/40 bg-[#F0FDF4]/50 shadow-[4px_4px_0_#68AB48]"
                        }`}
                      >
                        <div className="flex w-full flex-wrap items-center justify-between gap-4 p-6">
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
                                hasMistakes
                                  ? "bg-[#FEF3F2] text-[#B42318]"
                                  : "bg-[#DCFCE7] text-[#15803D]"
                              }`}
                            >
                              {hasMistakes ? <XCircle className="w-6 h-6 text-[#B42318]" /> : <Sparkles className="w-6 h-6 text-[#15803D]" />}
                            </div>
                            <div>
                              <h3 className="text-[20px] font-black text-[#173F5F]">
                                {group.lesson_name}
                              </h3>
                              <p className="mt-1 text-[12px] font-bold text-[#6B7280]">
                                {hasMistakes
                                  ? `${group.mistakes.length} ${group.mistakes.length === 1 ? "خطأ يحتاج مراجعة وتحليل" : "أخطاء تحتاج مراجعة وتحليل"}`
                                  : "تمت إجابة جميع الواجبات بشكل صحيح"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {hasMistakes ? (
                              <button
                                type="button"
                                onClick={() => toggleLessonExpand(group.lesson_name)}
                                className="rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-4 py-2 text-[12px] font-black text-[#173F5F] shadow-[2px_2px_0_#173F5F] hover:bg-[#F3B926] transition cursor-pointer"
                              >
                                {isExpanded ? "إخفاء الأخطاء ↑" : "انتقال للأخطاء ↵"}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#68AB48]/30 bg-[#DCFCE7] px-4 py-1.5 text-[12px] font-black text-[#166534]">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>تمام يا بطل مفيش أخطاء</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="rounded-b-[22px] border-t-2 border-[#DCE4EF] bg-[#F7F9FC] p-6">
                            {!hasMistakes ? (
                              <div className="rounded-[20px] border-2 border-[#68AB48]/30 bg-white p-8 text-center text-[#27743A]">
                                <strong className="mb-1 block text-[20px] font-black">
                                  تمام يا بطل مفيش أخطاء في الدرس ده!
                                </strong>
                              </div>
                            ) : (
                              <div className="grid gap-5">
                                {group.mistakes.map((mistake, index) => (
                                  <article
                                    className="rounded-[24px] border-2 border-[#B42318]/40 bg-white p-6 shadow-[4px_4px_0_#FDE2E1]"
                                    key={mistake.answer_id}
                                  >
                                    <div className="flex items-start justify-between gap-4 max-md:flex-col">
                                      <div>
                                        <span className="rounded-full bg-[#FDE2E1] px-3 py-1 text-[11px] font-black text-[#B42318]">
                                          سؤال {index + 1}
                                        </span>
                                        <p className="mt-4 text-[12px] font-bold text-[#20639B]">
                                          {mistake.homework_title}
                                        </p>
                                        <h3 className="mt-2 text-[19px] font-black leading-[1.8] text-[#173F5F]">
                                          {mistake.question_text}
                                        </h3>
                                      </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                      <div className="rounded-[16px] border-2 border-[#B42318]/25 bg-[#FEF3F2] p-4">
                                        <p className="text-[12px] font-black text-[#B42318]">
                                          إجابتك الخطأ
                                        </p>
                                        <p className="mt-2 text-[14px] font-bold text-[#7F1D1D]">
                                          {getAnswerText(mistake, false)}
                                        </p>
                                      </div>
                                      <div className="rounded-[16px] border-2 border-[#68AB48]/30 bg-[#F0FDF4] p-4">
                                        <p className="text-[12px] font-black text-[#27743A]">
                                          الإجابة الصحيحة
                                        </p>
                                        <p className="mt-2 text-[14px] font-bold text-[#166534]">
                                          {getAnswerText(mistake, true)}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Admin Question Analysis Box (تحليل / شرح السؤال من الأدمن) */}
                                    <div className="mt-4">
                                      {mistake.teacher_feedback ? (
                                        <div className="rounded-[16px] border-2 border-[#F6C445] bg-[#FFF9E8] p-4 text-[#8A6500]">
                                          <strong className="block text-[12px] font-black text-[#173F5F] mb-1">
                                            💡 تحليل وتوضيح السؤال من الأدمن:
                                          </strong>
                                          <p className="text-[13px] font-bold leading-[1.8]">
                                            {mistake.teacher_feedback}
                                          </p>
                                        </div>
                                      ) : (
                                        <p className="rounded-[14px] bg-[#F7F9FC] border border-[#DCE4EF] px-4 py-3 text-[12px] font-bold text-[#94A3B8]">
                                          لم يتم إرفاق تحليل إضافي من الأدمن لهذا السؤال.
                                        </p>
                                      )}
                                    </div>
                                  </article>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Bottom Footer with Logout button */}
      <footer className="mt-16 border-t-2 border-[#DCE4EF] bg-white py-8">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1200px] items-center justify-between gap-4 max-sm:flex-col lg:w-[calc(100%-6rem)]">
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

