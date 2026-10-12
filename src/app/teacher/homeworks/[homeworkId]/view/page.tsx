"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance, getApiError, getStoredSession } from "../../../../lib/auth";
import { useToast } from "../../../../components/ToastProvider";

type HomeworkDetails = {
  id: string;
  title: string;
  lesson_name: string;
  group_id: string;
  group_name: string;
  questions: { id: string; type: string; text: string; points: number }[];
};
type GroupStudent = { student_id: string; student_name: string; student_phone: string; student_parent_phone: string | null };
type Submission = {
  id: string;
  student_id: string;
  student_name: string;
  status: string;
  total_score: number | null;
  max_score: number | null;
  submitted_at: string | null;
};
type StudentFilter = "all" | "not_solved" | "full_score";

export default function TeacherHomeworkViewPage() {
  const params = useParams<{ homeworkId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const homeworkId = params.homeworkId;
  const [homework, setHomework] = useState<HomeworkDetails | null>(null);
  const [students, setStudents] = useState<GroupStudent[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentFilter, setStudentFilter] = useState<StudentFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getStoredSession();
    if (!session || session.user.role !== "teacher") {
      router.replace("/login?role=teacher");
      return;
    }
    const loadPage = async () => {
      try {
        const homeworkResponse = await axiosInstance.get<HomeworkDetails>(`/homeworks/${homeworkId}`);
        const [studentsResponse, submissionsResponse] = await Promise.all([
          axiosInstance.get<GroupStudent[]>(`/groups/${homeworkResponse.data.group_id}/students`),
          axiosInstance.get<Submission[]>(`/homeworks/${homeworkId}/submissions`),
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
    };
    void loadPage();
  }, [homeworkId, router, showToast]);

  const solvedIds = useMemo(
    () => new Set(submissions.filter((submission) => submission.status === "submitted" || submission.status === "graded").map((submission) => submission.student_id)),
    [submissions],
  );
  const solvedCount = solvedIds.size;
  const notSolvedCount = Math.max(students.length - solvedCount, 0);
  const hasEssay = homework?.questions.some((question) => question.type === "essay") ?? false;

  const getSubmission = (studentId: string) => submissions.find((item) => item.student_id === studentId);
  const isFullScore = (submission: Submission | undefined) => {
    if (!submission || submission.status === "in_progress" || submission.total_score === null || submission.max_score === null) return false;
    if (hasEssay && submission.status !== "graded") return false;
    return Number(submission.max_score) > 0 && Number(submission.total_score) === Number(submission.max_score);
  };
  const filteredStudents = useMemo(
    () => students.filter((student) => {
      const submission = getSubmission(student.student_id);
      if (studentFilter === "not_solved") return !solvedIds.has(student.student_id);
      if (studentFilter === "full_score") return isFullScore(submission);
      return true;
    }),
    [hasEssay, solvedIds, studentFilter, students, submissions],
  );

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#1F2937]">
      <header className="border-b-2 border-[#DCE4EF] bg-white">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1200px] items-center justify-between gap-6 py-5 max-md:flex-wrap max-md:gap-3 lg:w-[calc(100%-6rem)]">
          <Link className="text-[28px] font-black tracking-[-1.5px] text-[#173F5F]" href="/teacher">
            واجبك<span className="text-[#F6C445]">.</span>
          </Link>
          <Link
            className="rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-4 py-2 text-[12px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F]"
            href={homework ? `/teacher/groups/${homework.group_id}` : "/teacher"}
          >
            رجوع للمجموعة
          </Link>
        </div>
      </header>

      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1200px] py-12 lg:w-[calc(100%-6rem)]">
        {loading ? (
          <p className="rounded-[24px] bg-white p-12 text-center text-[#6B7280]">جاري تحميل عرض الواجب...</p>
        ) : !homework ? (
          <p className="rounded-[24px] border-2 border-[#B42318]/30 bg-[#FEF3F2] p-8 text-center font-bold text-[#B42318]">
            {error || "الواجب غير موجود."}
          </p>
        ) : (
          <>
            <div className="mb-10 flex items-end justify-between gap-6 max-md:flex-col max-md:items-start">
              <div>
                <p className="mb-3 text-[14px] font-black text-[#20639B]">{homework.group_name} · {homework.lesson_name}</p>
                <h1 className="text-[clamp(36px,5vw,64px)] font-black leading-[1.1] tracking-[-2px] text-[#173F5F]">
                  عرض الواجب: {homework.title}
                </h1>
                <p className="mt-4 text-[15px] text-[#6B7280]">اعرف مين حل الواجب ومين لسه، من غير ما تدخل في تفاصيل التصحيح.</p>
              </div>
              {hasEssay ? (
                <Link
                  className="rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-5 py-3 text-[13px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F]"
                  href={`/teacher/homeworks/${homework.id}/grading`}
                >
                  فتح صفحة التصحيح
                </Link>
              ) : (
                <span className="rounded-full border-2 border-[#68AB48] bg-[#F0FDF4] px-5 py-3 text-[13px] font-black text-[#27743A]">
                  تم التصحيح إلكترونيًا
                </span>
              )}
            </div>

            {error && (
              <p className="mb-6 rounded-[14px] border-2 border-[#B42318]/25 bg-[#FEF3F2] px-4 py-3 text-[14px] font-bold text-[#B42318]">{error}</p>
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

            <section className="mt-10 rounded-[26px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#DCE4EF]">
              <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
                <div>
                  <h2 className="text-[26px] font-black text-[#173F5F]">قائمة طلاب المجموعة</h2>
                  <p className="mt-2 text-[13px] text-[#6B7280]">الاسم بالأحمر يعني أن الطالب لم يسلّم الواجب.</p>
                </div>
                <span className="rounded-full bg-[#EFF6FF] px-3 py-2 text-[11px] font-black text-[#20639B]">{filteredStudents.length} طالب</span>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2 rounded-[18px] border-2 border-[#DCE4EF] bg-[#F7F9FC] p-3">
                <span className="ml-2 text-[12px] font-black text-[#6B7280]">عرض:</span>
                {([
                  ["all", "كل الطلاب"],
                  ["not_solved", "اللي محلوش"],
                  ["full_score", "الدرجة الكاملة"],
                ] as [StudentFilter, string][]).map(([filter, label]) => (
                  <button
                    className={`rounded-full border-2 px-4 py-2 text-[12px] font-black transition ${studentFilter === filter ? "border-[#173F5F] bg-[#173F5F] text-white shadow-[2px_2px_0_#F6C445]" : "border-[#DCE4EF] bg-white text-[#173F5F] hover:border-[#20639B]"}`}
                    key={filter}
                    onClick={() => setStudentFilter(filter)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
              {students.length === 0 ? (
                <p className="mt-6 rounded-[16px] border-2 border-dashed border-[#DCE4EF] p-8 text-center text-[#6B7280]">مفيش طلاب في المجموعة.</p>
              ) : filteredStudents.length === 0 ? (
                <p className="mt-6 rounded-[16px] border-2 border-dashed border-[#DCE4EF] p-8 text-center text-[#6B7280]">
                  {studentFilter === "not_solved" ? "كل الطلاب حلوا الواجب 🎉" : "مفيش طلاب جايبين الدرجة الكاملة لسه."}
                </p>
              ) : (
                <div className="mt-6 overflow-x-auto rounded-[18px] border-2 border-[#DCE4EF]">
                  <table className="w-full min-w-[980px] border-collapse text-right">
                    <thead className="bg-[#173F5F] text-white">
                      <tr><th className="px-4 py-4 text-[12px] font-black">#</th><th className="px-4 py-4 text-[12px] font-black">اسم الطالب</th><th className="px-4 py-4 text-[12px] font-black">رقم الطالب</th><th className="px-4 py-4 text-[12px] font-black">رقم ولي الأمر</th><th className="px-4 py-4 text-[12px] font-black">الحالة</th><th className="px-4 py-4 text-[12px] font-black">الدرجة</th><th className="px-4 py-4 text-[12px] font-black">الإجراء</th></tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, index) => {
                        const submission = getSubmission(student.student_id);
                        const solved = solvedIds.has(student.student_id);
                        return (
                          <tr className={`border-t-2 ${solved ? "border-[#DCE4EF] bg-white" : "border-[#FECACA] bg-[#FEF2F2]"}`} key={student.student_id}>
                            <td className="px-4 py-4 text-[12px] font-black text-[#20639B]">{String(index + 1).padStart(2, "0")}</td>
                            <td className={`px-4 py-4 text-[14px] font-black ${solved ? "text-[#173F5F]" : "text-[#B42318]"}`}>{student.student_name}</td>
                            <td className="px-4 py-4 text-[12px] font-bold text-[#6B7280]">{student.student_phone}</td>
                            <td className="px-4 py-4 text-[12px] font-bold text-[#20639B]">{student.student_parent_phone ?? "غير مسجل"}</td>
                            <td className="px-4 py-4">{solved ? <span className="rounded-full bg-[#F0FDF4] px-3 py-2 text-[10px] font-black text-[#27743A]">تم الحل</span> : <span className="rounded-full bg-[#FEE2E2] px-3 py-2 text-[10px] font-black text-[#B42318]">لم يحل</span>}</td>
                            <td className="px-4 py-4 text-[12px] font-black text-[#173F5F]">{submission?.total_score !== null && submission?.total_score !== undefined ? `${submission.total_score} / ${submission.max_score ?? "-"}` : "-"}{isFullScore(submission) && <span className="mr-2 rounded-full bg-[#F0FDF4] px-2 py-1 text-[10px] text-[#27743A]">كاملة</span>}</td>
                            <td className="px-4 py-4">{solved && hasEssay ? <Link className="rounded-full border-2 border-[#20639B] bg-[#EFF6FF] px-3 py-2 text-[10px] font-black text-[#20639B]" href={`/teacher/homeworks/${homework.id}/grading`}>افتح التصحيح</Link> : solved && submission?.status === "graded" ? <span className="rounded-full bg-[#EAF7E5] px-3 py-2 text-[10px] font-black text-[#27743A]">تم التصحيح</span> : solved ? <span className="text-[11px] font-black text-[#68AB48]">إلكتروني</span> : <span className="text-[11px] font-black text-[#B42318]">في الانتظار</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
