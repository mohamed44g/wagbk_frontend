"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance, getApiError, getStoredSession } from "../../../lib/auth";
import { useToast } from "../../../components/ToastProvider";

type Choice = { id: string; text: string; orderIndex: number };
type HomeworkQuestion = {
  id: string;
  type: "mcq" | "true_false" | "essay";
  text: string;
  image_url: string | null;
  points: number;
  order_index: number;
  choices: Choice[];
};
type HomeworkDetails = {
  id: string;
  title: string;
  description: string | null;
  lesson_name: string;
  group_name: string;
  due_date: string | null;
  duration_minutes: number | null;
  is_expired: boolean;
  questions: HomeworkQuestion[];
};
type Submission = {
  id: string;
  homework_id: string;
  status: "in_progress" | "submitted" | "graded" | string;
  auto_score: number | null;
  manual_score: number | null;
  total_score: number | null;
  max_score: number | null;
  submitted_at: string | null;
  started_at: string | null;
};

const inputClass =
  "mt-2 w-full rounded-[14px] border-2 border-[#DCE4EF] bg-white px-4 py-3 text-[14px] text-[#173F5F] outline-none focus:border-[#20639B] focus:shadow-[3px_3px_0_#20639B]";

function formatScore(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") return "0";
  const num = Number(val);
  if (isNaN(num)) return "0";
  return Number(num.toFixed(2)).toString();
}

function formatDate(date: string | null) {
  if (!date) return "من غير موعد انتهاء";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function isDateExpired(date: string | null) {
  return date ? new Date(date).getTime() <= Date.now() : false;
}

function compressEssayImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("اختار ملف صورة صالح."));
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxEdge = 1600;
      const scale = Math.min(1, maxEdge / image.naturalWidth, maxEdge / image.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("تعذر تجهيز الصورة."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.84));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("تعذر قراءة الصورة."));
    };
    image.src = objectUrl;
  });
}

export default function StudentHomeworkPage() {
  const params = useParams<{ homeworkId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const homeworkId = params.homeworkId;
  const [homework, setHomework] = useState<HomeworkDetails | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [essayImages, setEssayImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getStoredSession();
    if (!session || session.user.role !== "student") {
      router.replace("/login?role=student");
      return;
    }

    const loadHomework = async () => {
      try {
        const homeworkResponse = await axiosInstance.get<HomeworkDetails>(`/homeworks/${homeworkId}`);
        setHomework(homeworkResponse.data);
        try {
          const submissionResponse = await axiosInstance.post<Submission>(`/homeworks/${homeworkId}/submissions`);
          setSubmission(submissionResponse.data);
        } catch (submissionError) {
          setError(getApiError(submissionError));
        }
      } catch (loadError) {
        const message = getApiError(loadError);
        setError(message);
        showToast({ type: "error", message });
      } finally {
        setLoading(false);
      }
    };

    void loadHomework();
  }, [homeworkId, router, showToast]);

  function selectAnswer(questionId: string, choiceId: string) {
    setAnswers((current) => ({ ...current, [questionId]: choiceId }));
  }

  async function selectEssayImage(questionId: string, file: File | undefined) {
    if (!file) return;
    try {
      const imageDataUrl = await compressEssayImage(file);
      setEssayImages((current) => ({ ...current, [questionId]: imageDataUrl }));
    } catch (imageError) {
      const message = imageError instanceof Error ? imageError.message : "تعذر إضافة الصورة.";
      setError(message);
      showToast({ type: "error", message });
    }
  }

  function removeEssayImage(questionId: string) {
    setEssayImages((current) => {
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  }

  const handleSubmit = useCallback(async (isAutomatic = false) => {
    if (!homework || !submission || submitting) return;
    if (!isAutomatic) {
      const unanswered = homework.questions.find((question) =>
        question.type === "essay"
          ? !answers[question.id]?.trim() && !essayImages[question.id]
          : !answers[question.id]?.trim(),
      );
      if (unanswered) {
        const message = "جاوب على كل الأسئلة قبل التسليم.";
        setError(message);
        showToast({ type: "error", message });
        return;
      }
    }

    setSubmitting(true);
    setError("");
    try {
      const { data } = await axiosInstance.patch<Submission>(`/submissions/${submission.id}`, {
        answers: homework.questions.filter((question) =>
          question.type === "essay"
            ? answers[question.id]?.trim() || essayImages[question.id]
            : answers[question.id]?.trim(),
        ).map((question) =>
          question.type === "mcq"
            ? { questionId: question.id, selectedChoiceId: answers[question.id] }
              : question.type === "true_false"
                ? { questionId: question.id, selectedBoolean: answers[question.id] === "true" }
                : {
                    questionId: question.id,
                    essayText: answers[question.id]?.trim() || undefined,
                    essayImageUrl: essayImages[question.id],
                  },
        ),
        autoSubmit: isAutomatic,
      });
      setSubmission(data);
      setAutoSubmitted(isAutomatic);
      setShowCompletionDialog(true);
      showToast({
        type: "success",
        message: isAutomatic
          ? "انتهى وقت الحل وتم تسليم الواجب تلقائيًا."
          : homework.questions.some((question) => question.type === "essay")
            ? "تم تسليم الواجب، والنتيجة هتظهر بعد تصحيح المدرس."
            : "تم تسليم الواجب وحساب نتيجتك.",
      });
    } catch (submitError) {
      const message = getApiError(submitError);
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  }, [answers, essayImages, homework, showToast, submission, submitting]);

  useEffect(() => {
    if (
      !homework?.duration_minutes ||
      !submission?.started_at ||
      submission.status !== "in_progress" ||
      isDateExpired(homework.due_date)
    ) {
      return;
    }

    const duration = Number(homework.duration_minutes);
    const startedAt = new Date(submission.started_at).getTime();
    if (!Number.isFinite(duration) || !Number.isFinite(startedAt)) return;

    const updateRemaining = () => {
      if (isDateExpired(homework.due_date)) return;
      const endAt = startedAt + duration * 60 * 1000;
      const nextRemaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemainingSeconds(nextRemaining);
      if (nextRemaining === 0 && !submitting) void handleSubmit(true);
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [handleSubmit, homework?.due_date, homework?.duration_minutes, submission?.started_at, submission?.status, submitting]);

  const isSubmitted = submission?.status === "submitted" || submission?.status === "graded";
  const hasEssay = homework?.questions.some((question) => question.type === "essay") ?? false;
  const isExpired = homework?.is_expired ?? false;
  const isWaitingForGrading = submission?.status === "submitted" && hasEssay;
  const isReadyForReview = isSubmitted && !isWaitingForGrading;
  const maxScore = homework?.questions.reduce((sum, question) => sum + question.points, 0) ?? 0;
  const finalScore = submission
    ? Number(submission.total_score ?? Number(submission.auto_score ?? 0) + Number(submission.manual_score ?? 0))
    : 0;
  const hasActiveTimer = Boolean(
    homework?.duration_minutes &&
      submission?.started_at &&
      submission.status === "in_progress" &&
      !isExpired &&
      !isDateExpired(homework.due_date),
  );

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#1F2937]">
      <header className="border-b-2 border-[#DCE4EF] bg-white">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1100px] items-center justify-between gap-6 py-5 max-md:flex-wrap max-md:gap-3 lg:w-[calc(100%-6rem)]">
          <Link className="text-[28px] font-black tracking-[-1.5px] text-[#173F5F]" href="/student">
            واجبك<span className="text-[#F6C445]">.</span>
          </Link>
          <Link
            className="rounded-full border-2 border-[#173F5F] bg-white px-4 py-2 text-[12px] font-black text-[#173F5F]"
            href="/student"
          >
            رجوع للواجبات
          </Link>
        </div>
      </header>

      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1100px] py-12 lg:w-[calc(100%-6rem)]">
        {loading ? (
          <p className="rounded-[24px] bg-white p-12 text-center text-[#6B7280]">جاري فتح الواجب...</p>
        ) : !homework ? (
          <p className="rounded-[24px] border-2 border-[#B42318]/30 bg-[#FEF3F2] p-8 text-center font-bold text-[#B42318]">
            {error || "الواجب غير متاح حاليًا."}
          </p>
        ) : (
          <>
            {showCompletionDialog && submission && (
              <div
                aria-modal="true"
                className="fixed inset-0 z-50 grid place-items-center bg-[#173F5F]/55 px-4 py-6"
                role="dialog"
              >
                <section className="w-full max-w-[560px] rounded-[28px] border-2 border-[#173F5F] bg-white p-7 text-center shadow-[7px_7px_0_#F6C445] md:p-10">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#27743A] bg-[#EAF7E5] text-[32px] font-black text-[#27743A]">
                    ✓
                  </span>
                  <p className="mt-5 text-[14px] font-black text-[#27743A]">
                    {autoSubmitted ? "انتهى وقت الحل وتم التسليم تلقائيًا" : "تم تسليم الواجب بنجاح"}
                  </p>
                  {hasEssay ? (
                    <>
                      <h2 className="mt-3 text-[28px] font-black text-[#173F5F]">إجابتك وصلت للمدرس</h2>
                      <p className="mt-3 text-[14px] leading-[1.9] text-[#6B7280]">
                        الدرجة النهائية والتحليل هيفضلوا معلّقين لحد ما المدرس يصحح السؤال المقالي.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="mt-3 text-[28px] font-black text-[#173F5F]">درجتك اتحسبت</h2>
                      <strong className="mt-3 block text-[36px] font-black text-[#27743A]">
                        {formatScore(finalScore)} / {formatScore(submission.max_score ?? maxScore)}
                      </strong>
                      <p className="mt-2 text-[14px] leading-[1.9] text-[#6B7280]">
                        تم تصحيح الواجب إلكترونيًا وتقدر تشوف التفاصيل والأخطاء دلوقتي.
                      </p>
                    </>
                  )}
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <button
                      className="rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-5 py-3 text-[13px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#173F5F]"
                      onClick={() =>
                        router.push(
                          hasEssay ? "/student" : `/student/review?homeworkId=${homework.id}`,
                        )
                      }
                      type="button"
                    >
                      {hasEssay ? "موافق، رجوع للواجبات" : "موافق، عرض الدرجة"}
                    </button>
                    {!hasEssay && (
                      <button
                        className="rounded-full border-2 border-[#173F5F] bg-white px-5 py-3 text-[13px] font-black text-[#173F5F]"
                        onClick={() => router.push("/student")}
                        type="button"
                      >
                        كل الواجبات
                      </button>
                    )}
                  </div>
                </section>
              </div>
            )}
            <section className="rounded-[28px] border-2 border-[#173F5F] bg-[#173F5F] p-7 text-white shadow-[6px_6px_0_#F6C445] md:p-10">
              <div className="flex items-start justify-between gap-5 max-md:flex-col">
                <div>
                  <span className="rounded-full bg-[#F6C445] px-3 py-1 text-[11px] font-black text-[#173F5F]">
                    {homework.lesson_name}
                  </span>
                  <h1 className="mt-5 text-[clamp(34px,5vw,58px)] font-black leading-[1.1] tracking-[-2px]">
                    {homework.title}
                  </h1>
                  <p className="mt-4 max-w-[700px] text-[15px] leading-[1.9] text-[#DCEBFA]">
                    {homework.description ?? "حل الأسئلة واختار الإجابة الصح، وبعدها سلّم الواجب عشان تعرف نتيجتك."}
                  </p>
                </div>
                <div className="shrink-0 rounded-[18px] border border-[#B5C9DD]/40 bg-white/10 px-4 py-3 text-left text-[12px] text-[#DCEBFA]">
                  <p>المجموعة</p>
                  <strong className="mt-1 block text-[15px] text-white">{homework.group_name}</strong>
                  <p className="mt-3">ينتهي</p>
                  <strong className="mt-1 block text-[12px] text-[#F6C445]">{formatDate(homework.due_date)}</strong>
                </div>
              </div>
            </section>

            {error && (
              <p className="mt-6 rounded-[14px] border-2 border-[#B42318]/25 bg-[#FEF3F2] px-4 py-3 text-[14px] font-bold text-[#B42318]">
                {error}
              </p>
            )}

            {hasActiveTimer && remainingSeconds !== null && !isSubmitted && !isExpired && (
              <section className={`mt-6 flex items-center justify-between gap-4 rounded-[22px] border-2 p-5 shadow-[4px_4px_0_#DCE4EF] max-sm:flex-col max-sm:items-stretch ${remainingSeconds <= 60 ? "border-[#B42318] bg-[#FEF2F2] text-[#B42318]" : "border-[#20639B] bg-[#EFF6FF] text-[#173F5F]"}`}>
                <div>
                  <p className="text-[13px] font-black">وقت حل الواجب</p>
                  <p className="mt-1 text-[12px] font-bold opacity-75">الواجب هيتسلّم تلقائيًا لما الوقت يخلص.</p>
                </div>
                <strong className="rounded-full bg-white px-5 py-3 text-[24px] font-black tabular-nums shadow-[2px_2px_0_currentColor]">
                  {formatRemainingTime(remainingSeconds)}
                </strong>
              </section>
            )}

            {isExpired && !isSubmitted && (
              <section className="mt-6 rounded-[24px] border-2 border-[#B42318] bg-[#FEF2F2] p-6 text-[#B42318] shadow-[4px_4px_0_#FECACA]">
                <p className="text-[14px] font-black">الواجب مقفول</p>
                <strong className="mt-2 block text-[24px] font-black">انتهى موعد تسليم الواجب.</strong>
                <p className="mt-2 text-[13px] leading-[1.8]">مش هتقدر تضيف إجابات أو تسلّم الواجب بعد الموعد المحدد.</p>
              </section>
            )}

            {isWaitingForGrading && (
              <section className="mt-8 rounded-[24px] border-2 border-[#F6C445] bg-[#FFF9E8] p-6 text-[#8A6500] shadow-[4px_4px_0_#DCE4EF]">
                <p className="text-[14px] font-black">تم تسليم الواجب بنجاح</p>
                <strong className="mt-2 block text-[24px] font-black">النتيجة والتحليل بعد تصحيح المدرس</strong>
                <p className="mt-2 text-[13px] leading-[1.8]">
                  الواجب فيه سؤال مقالي، لذلك مش هنعرض نتيجة نهائية أو أخطاء قبل ما المدرس يراجعه.
                </p>
              </section>
            )}

            {isReadyForReview && (
              <section className="mt-8 rounded-[24px] border-2 border-[#68AB48] bg-[#F0FDF4] p-6 text-[#27743A] shadow-[4px_4px_0_#DCE4EF]">
                <p className="text-[14px] font-black">تم تسليم الواجب بنجاح</p>
                <strong className="mt-2 block text-[34px] font-black">
                  نتيجتك: {formatScore(finalScore)} / {formatScore(submission.max_score ?? maxScore)}
                </strong>
                <Link
                  className="mt-4 inline-flex rounded-full border-2 border-[#27743A] bg-white px-4 py-2 text-[12px] font-black text-[#27743A]"
                  href={`/student/review?homeworkId=${homework.id}`}
                >
                  راجع أخطاءك وتقييمك
                </Link>
              </section>
            )}

            <section className="mt-8 grid gap-5">
              {homework.questions.map((question, index) => (
                <article
                  className="rounded-[24px] border-2 border-[#173F5F] bg-white p-6 shadow-[4px_4px_0_#DCE4EF] md:p-8"
                  key={question.id}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F6C445] text-[15px] font-black text-[#173F5F]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[19px] font-black leading-[1.8] text-[#173F5F]">{question.text}</p>
                      {question.type === "mcq" ? (
                        <div className="mt-6 grid grid-cols-2 gap-3 max-md:grid-cols-1">
                          {question.choices.map((choice) => {
                            const selected = answers[question.id] === choice.id;
                            return (
                              <label
                                className={`flex cursor-pointer items-center gap-3 rounded-[16px] border-2 px-4 py-4 text-[14px] font-black transition ${
                                  selected
                                    ? "border-[#20639B] bg-[#EFF6FF] text-[#173F5F] shadow-[3px_3px_0_#20639B]"
                                    : "border-[#DCE4EF] bg-white text-[#6B7280] hover:border-[#20639B]"
                                } ${isSubmitted || isExpired ? "cursor-default opacity-80" : ""}`}
                                key={choice.id}
                              >
                                <input
                                  checked={selected}
                                  className="h-4 w-4 accent-[#20639B]"
                                  disabled={isSubmitted || isExpired || !submission}
                                  name={`question-${question.id}`}
                                  onChange={() => selectAnswer(question.id, choice.id)}
                                  type="radio"
                                />
                                <span>{choice.text}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : question.type === "true_false" ? (
                        <div className="mt-6 grid grid-cols-2 gap-3 max-md:grid-cols-1">
                          {[{ value: "true", label: "صح" }, { value: "false", label: "خطأ" }].map((option) => {
                            const selected = answers[question.id] === option.value;
                            return (
                              <label
                                className={`flex cursor-pointer items-center gap-3 rounded-[16px] border-2 px-4 py-4 text-[14px] font-black transition ${
                                  selected
                                    ? "border-[#20639B] bg-[#EFF6FF] text-[#173F5F] shadow-[3px_3px_0_#20639B]"
                                    : "border-[#DCE4EF] bg-white text-[#6B7280] hover:border-[#20639B]"
                                } ${isSubmitted || isExpired ? "cursor-default opacity-80" : ""}`}
                                key={option.value}
                              >
                                <input
                                  checked={selected}
                                  className="h-4 w-4 accent-[#20639B]"
                                  disabled={isSubmitted || isExpired || !submission}
                                  name={`question-${question.id}`}
                                  onChange={() => selectAnswer(question.id, option.value)}
                                  type="radio"
                                />
                                <span>{option.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-6 grid gap-3">
                          <textarea
                            className={`${inputClass} min-h-[120px] resize-y`}
                            disabled={isSubmitted || isExpired || !submission}
                            onChange={(event) => selectAnswer(question.id, event.target.value)}
                            placeholder="اكتب إجابتك هنا أو أضف صورة للحل"
                            value={answers[question.id] ?? ""}
                          />
                          <label className={`rounded-[16px] border-2 border-dashed border-[#20639B]/50 bg-[#EFF6FF] p-4 text-[13px] font-black text-[#173F5F] ${isSubmitted || isExpired || !submission ? "opacity-70" : "cursor-pointer"}`}>
                            <span className="block">📷 إضافة صورة للحل (اختياري)</span>
                            <span className="mt-1 block text-[11px] font-bold text-[#6B7280]">ممكن تصور الحل أو تختار صورة من الجهاز.</span>
                            <input
                              accept="image/*"
                              capture="environment"
                              className="mt-3 block w-full text-[12px] font-bold"
                              disabled={isSubmitted || isExpired || !submission}
                              onChange={(event) => void selectEssayImage(question.id, event.target.files?.[0])}
                              type="file"
                            />
                          </label>
                          {essayImages[question.id] && (
                            <div className="relative w-fit max-w-full rounded-[16px] border-2 border-[#DCE4EF] bg-white p-2">
                              <img alt="صورة حل السؤال المقالي" className="max-h-[280px] max-w-full rounded-[12px] object-contain" src={essayImages[question.id]} />
                              {!isSubmitted && !isExpired && submission && (
                                <button
                                  className="mt-2 rounded-full border border-[#B42318]/30 bg-[#FEF2F2] px-3 py-1.5 text-[11px] font-black text-[#B42318]"
                                  onClick={() => removeEssayImage(question.id)}
                                  type="button"
                                >
                                  حذف الصورة
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </section>

            {!isSubmitted && !isExpired && submission && (
              <button
                className="mt-8 w-full rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-6 py-4 text-[16px] font-black text-[#173F5F] shadow-[4px_4px_0_#173F5F] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#173F5F] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                onClick={() => void handleSubmit()}
                type="button"
              >
                {submitting ? "جاري التسليم..." : "تسليم الواجب"}
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}
