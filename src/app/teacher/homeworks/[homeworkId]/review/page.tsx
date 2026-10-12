"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance, getApiError, getStoredSession } from "../../../../lib/auth";
import { useToast } from "../../../../components/ToastProvider";
import {
  Users,
  BookOpen,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  Award
} from "lucide-react";

type HomeworkQuestion = {
  id: string;
  type: "mcq" | "true_false" | "essay";
  text: string;
  points: number;
};
type HomeworkDetails = {
  id: string;
  title: string;
  description: string | null;
  lesson_name: string;
  group_id: string;
  group_name: string;
  questions: HomeworkQuestion[];
};
type GroupStudent = {
  student_id: string;
  student_name: string;
  student_phone: string;
  student_parent_phone: string | null;
};
type SubmissionSummary = {
  id: string;
  homework_id: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  status: string;
  auto_score: number | null;
  manual_score: number | null;
  total_score: number | null;
  max_score: number | null;
  submitted_at: string | null;
  graded_at: string | null;
};
type SubmissionAnswer = {
  id: string;
  question_id: string;
  question_text: string;
  type: "mcq" | "true_false" | "essay";
  points: number;
  selected_choice_text: string | null;
  correct_choice_text: string | null;
  selected_boolean: boolean | null;
  correct_boolean: boolean | null;
  essay_text: string | null;
  essay_image_url: string | null;
  is_correct: boolean | null;
  score: number | null;
  teacher_feedback: string | null;
};
type SubmissionDetails = SubmissionSummary & { homework_title: string; answers: SubmissionAnswer[] };

function formatScore(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") return "0";
  const num = Number(val);
  if (isNaN(num)) return "0";
  return Number(num.toFixed(2)).toString();
}

function answerText(answer: SubmissionAnswer, correct = false) {
  if (answer.type === "mcq") {
    return correct ? answer.correct_choice_text ?? "غير متاح" : answer.selected_choice_text ?? "لم تتم الإجابة";
  }
  if (answer.type === "true_false") {
    const value = correct ? answer.correct_boolean : answer.selected_boolean;
    return value === null || value === undefined ? "غير محدد" : value ? "صح" : "خطأ";
  }
  return answer.essay_text ?? "لم تتم الإجابة";
}

export default function TeacherHomeworkReviewPage() {
  const params = useParams<{ homeworkId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const homeworkId = params.homeworkId;
  const [homework, setHomework] = useState<HomeworkDetails | null>(null);
  const [students, setStudents] = useState<GroupStudent[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [error, setError] = useState("");

  async function loadPage() {
    const session = getStoredSession();
    if (!session || session.user.role !== "teacher") {
      router.replace("/login?role=teacher");
      return;
    }
    try {
      const homeworkResponse = await axiosInstance.get<HomeworkDetails>(`/homeworks/${homeworkId}`);
      const [studentsResponse, submissionsResponse] = await Promise.all([
        axiosInstance.get<GroupStudent[]>(`/groups/${homeworkResponse.data.group_id}/students`),
        axiosInstance.get<SubmissionSummary[]>(`/homeworks/${homeworkId}/submissions`),
      ]);
      setHomework(homeworkResponse.data);
      setStudents(studentsResponse.data);
      setSubmissions(submissionsResponse.data);
    } catch (loadError) {
      const message = getApiError(loadError);
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPage(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeworkId]);

  const submittedStudentIds = useMemo(
    () => new Set(submissions.filter((s) => s.status === "submitted" || s.status === "graded").map((s) => s.student_id)),
    [submissions]
  );
  const solvedCount = submittedStudentIds.size;
  const notSolvedCount = Math.max(students.length - solvedCount, 0);

  async function handleSelectStudent(submissionId: string) {
    setLoadingAnswers(true);
    setError("");
    try {
      const { data } = await axiosInstance.get<SubmissionDetails>(`/submissions/${submissionId}/answers`);
      setSelectedSubmission(data);
    } catch (answerError) {
      const message = getApiError(answerError);
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setLoadingAnswers(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#1F2937]">
      <header className="border-b-2 border-[#DCE4EF] bg-white">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1400px] items-center justify-between gap-6 py-5 max-md:flex-wrap max-md:gap-3 lg:w-[calc(100%-6rem)]">
          <Link className="text-[28px] font-black tracking-[-1.5px] text-[#173F5F]" href="/teacher">
            واجبك<span className="text-[#F6C445]">.</span>
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-4 py-2 text-[12px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F]"
            href={homework ? `/teacher/groups/${homework.group_id}` : "/teacher"}
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع للمجموعة</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1400px] py-12 lg:w-[calc(100%-6rem)]">
        {loading ? (
          <p className="rounded-[24px] bg-white p-12 text-center text-[#6B7280]">جاري تحميل بيانات الواجب...</p>
        ) : !homework ? (
          <p className="rounded-[24px] border-2 border-[#B42318]/30 bg-[#FEF3F2] p-8 text-center font-bold text-[#B42318]">
            {error || "الواجب غير موجود."}
          </p>
        ) : (
          <>
            <div className="mb-10 flex items-end justify-between gap-6 max-lg:flex-col max-lg:items-start">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] border border-[#20639B]/30 px-3.5 py-1 text-[12px] font-black text-[#20639B]">
                  <Eye className="w-3.5 h-3.5" />
                  شاشة متابعة نتائج وتصحيح الأدمن (عرض فقط)
                </span>
                <h1 className="mt-3 text-[clamp(32px,4vw,56px)] font-black leading-[1.1] tracking-[-2px] text-[#173F5F]">
                  متابعة إجابات: {homework.title}
                </h1>
                <p className="mt-2 text-[15px] text-[#6B7280]">
                  المجموعة: {homework.group_name} · الدرس: {homework.lesson_name}
                </p>
              </div>
              <span className="rounded-full bg-[#F6C445] px-4 py-2 text-[13px] font-black text-[#173F5F]">
                {homework.questions.length} سؤال بالواجب
              </span>
            </div>

            {error && (
              <p className="mb-6 rounded-[14px] border-2 border-[#B42318]/25 bg-[#FEF3F2] px-4 py-3 text-[14px] font-bold text-[#B42318]">
                {error}
              </p>
            )}

            <section className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
              <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#F6C445] p-6 shadow-[5px_5px_0_#173F5F]">
                <span className="text-[13px] font-black text-[#173F5F]">إجمالي طلبة المجموعة</span>
                <strong className="mt-3 block text-[42px] font-black text-[#173F5F]">{students.length}</strong>
              </div>
              <div className="rounded-[24px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#DCE4EF]">
                <span className="text-[13px] font-black text-[#6B7280]">حلوا الواجب</span>
                <strong className="mt-3 block text-[42px] font-black text-[#173F5F]">{solvedCount}</strong>
              </div>
              <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#173F5F] p-6 text-white shadow-[5px_5px_0_#F6C445]">
                <span className="text-[13px] font-black text-[#B5C9DD]">لم يحلوا الواجب</span>
                <strong className="mt-3 block text-[42px] font-black text-[#FCA5A5]">{notSolvedCount}</strong>
              </div>
            </section>

            <div className="mt-10 grid grid-cols-[.8fr_1.2fr] gap-6 max-lg:grid-cols-1">
              {/* Student List */}
              <section className="rounded-[26px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#DCE4EF]">
                <div className="flex items-center justify-between gap-3 border-b-2 border-[#DCE4EF] pb-4">
                  <div>
                    <h2 className="text-[24px] font-black text-[#173F5F]">طلاب المجموعة</h2>
                    <p className="mt-1 text-[12px] text-[#6B7280]">اضغط على اسم الطالب لاستعراض إجاباته ودرجته المرصودة.</p>
                  </div>
                  <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[12px] font-black text-[#20639B]">{students.length}</span>
                </div>
                <div className="mt-6 grid gap-3">
                  {students.length === 0 ? (
                    <p className="rounded-[16px] border-2 border-dashed border-[#DCE4EF] p-6 text-center text-[13px] text-[#6B7280]">مفيش طلاب في المجموعة.</p>
                  ) : (
                    students.map((student) => {
                      const submission = submissions.find((item) => item.student_id === student.student_id);
                      const solved = submission?.status === "submitted" || submission?.status === "graded";
                      const isGraded = submission?.status === "graded";
                      const selected = selectedSubmission?.student_id === student.student_id;
                      return (
                        <button
                          className={`flex items-center justify-between gap-3 rounded-[16px] border-2 px-4 py-3 text-right transition cursor-pointer ${
                            selected
                              ? "border-[#20639B] bg-[#EFF6FF] shadow-[3px_3px_0_#20639B]"
                              : solved
                                ? "border-[#DCE4EF] bg-white hover:border-[#20639B]"
                                : "border-[#FECACA] bg-[#FEF2F2] opacity-70"
                          }`}
                          disabled={!submission || loadingAnswers}
                          key={student.student_id}
                          onClick={() => submission && void handleSelectStudent(submission.id)}
                          type="button"
                        >
                          <span className="min-w-0">
                            <span className={`block truncate font-black ${solved ? "text-[#173F5F]" : "text-[#B42318]"}`}>{student.student_name}</span>
                            <span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#6B7280]">
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3 text-[#173F5F]" />
                                <span>{student.student_phone}</span>
                              </span>
                              {student.student_parent_phone && (
                                <span className="inline-flex items-center gap-1">
                                  <Users className="w-3 h-3 text-[#8A6500]" />
                                  <span>{student.student_parent_phone}</span>
                                </span>
                              )}
                            </span>
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black ${
                            isGraded ? "bg-[#DCFCE7] text-[#15803D]" : solved ? "bg-[#FFF9E8] text-[#8A6500]" : "text-[#B42318]"
                          }`}>
                            {isGraded ? "تم تصحيحه" : solved ? "محتاج تصحيح" : "لم يحل"}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Read Only Answers Viewer Panel */}
              <section className="rounded-[26px] border-2 border-[#173F5F] bg-[#173F5F] p-6 text-white shadow-[5px_5px_0_#F6C445]">
                {!selectedSubmission ? (
                  <div className="flex min-h-[360px] items-center justify-center text-center">
                    <div>
                      <Eye className="w-12 h-12 text-[#F6C445] mx-auto mb-3" />
                      <h2 className="text-[25px] font-black">اختار طالب لمتابعة إجاباته</h2>
                      <p className="mt-2 text-[13px] text-[#B5C9DD]">اختار طالب من القائمة لمتابعة الدرجة المرصودة وإجاباته بالتفصيل.</p>
                    </div>
                  </div>
                ) : loadingAnswers ? (
                  <p className="p-10 text-center text-[#B5C9DD]">جاري تحميل إجابات الطالب...</p>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-4 border-b border-[#B5C9DD]/30 pb-5">
                      <div>
                        <p className="text-[13px] text-[#B5C9DD]">استعراض نتائج الطالب</p>
                        <h2 className="mt-2 text-[28px] font-black">{selectedSubmission.student_name}</h2>
                      </div>
                      <div className="text-left">
                        <span className={`inline-block rounded-full px-3.5 py-1 text-[12px] font-black ${
                          selectedSubmission.status === "graded" ? "bg-[#68AB48] text-white" : "bg-[#F6C445] text-[#173F5F]"
                        }`}>
                          {selectedSubmission.status === "graded" ? "تم تصحيحه" : "في انتظار تصحيح الأدمن"}
                        </span>
                        {selectedSubmission.total_score !== null && (
                          <strong className="block mt-2 text-[22px] font-black text-[#F6C445]">
                            الدرجة: {formatScore(selectedSubmission.total_score)} / {formatScore(selectedSubmission.max_score)}
                          </strong>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4">
                      {selectedSubmission.answers.map((answer, index) => (
                        <article className="rounded-[18px] border border-[#B5C9DD]/30 bg-white/10 p-4" key={answer.id}>
                          <div className="flex items-start gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F6C445] text-[12px] font-black text-[#173F5F]">
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-black leading-[1.8]">{answer.question_text}</h3>
                              {answer.type === "essay" ? (
                                <>
                                  <div className="mt-3 rounded-[14px] border border-[#B5C9DD]/30 bg-[#0F3552] p-3.5 text-[13px] leading-[1.8] text-[#DCEBFA]">
                                    <strong className="block text-[11px] text-[#F6C445] mb-1">إجابة الطالب المقالية:</strong>
                                    {answer.essay_text || "لم يكتب الطالب إجابة نصية."}
                                  </div>
                                  {answer.essay_image_url && (
                                    <div className="mt-3 rounded-[14px] border border-[#B5C9DD]/30 bg-[#0F3552] p-3.5">
                                      <strong className="block text-[11px] text-[#F6C445] mb-2">صورة حل الطالب:</strong>
                                      <a href={answer.essay_image_url} rel="noreferrer" target="_blank">
                                        <img
                                          alt="صورة حل الطالب للسؤال المقالي"
                                          className="max-h-[420px] max-w-full rounded-[12px] border border-[#B5C9DD]/30 bg-white object-contain"
                                          src={answer.essay_image_url}
                                        />
                                      </a>
                                      <p className="mt-2 text-[11px] text-[#B5C9DD]">اضغط على الصورة لفتحها بحجم أكبر.</p>
                                    </div>
                                  )}
                                  <div className="mt-3 rounded-[14px] bg-white/10 p-3 text-[12px]">
                                    <p className="font-bold text-[#F6C445]">
                                      درجة الأدمن المقالية: {answer.score !== null ? `${formatScore(answer.score)} / ${formatScore(answer.points)}` : "في انتظار رصد الأدمن"}
                                    </p>
                                    {answer.teacher_feedback && (
                                      <p className="mt-1 text-[#DCEBFA]">ملاحظة الأدمن: {answer.teacher_feedback}</p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="mt-3 grid grid-cols-2 gap-3 text-[12px] max-sm:grid-cols-1">
                                  <p className="rounded-[12px] bg-white/10 p-3">إجابة الطالب: <strong>{answerText(answer)}</strong></p>
                                  <p className="rounded-[12px] bg-[#68AB48]/20 p-3">الإجابة الصحيحة: <strong>{answerText(answer, true)}</strong></p>
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
