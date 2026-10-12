"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance, getApiError, getStoredSession } from "../../../lib/auth";
import { useToast } from "../../../components/ToastProvider";
import {
  Users,
  BookOpen,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  Search,
  Award,
  Eye,
  GraduationCap,
  Copy
} from "lucide-react";

type ScheduleSlot = { day: string; time: string };
type GroupOverview = {
  id: string;
  name: string;
  subject_name_ar: string;
  subject_name_en: string;
  academic_year: number;
  schedule_slots: ScheduleSlot[];
  center_name: string;
  students_count: number;
  homeworks_count: number;
  submissions_count: number;
};
type GroupStudent = {
  student_id: string;
  student_name: string;
  student_phone: string;
  student_parent_phone: string | null;
  submissions_count: number;
  total_score: number;
  total_max_score: number;
  score_percentage: number;
  latest_status: string | null;
  latest_score: number | null;
  latest_max_score: number | null;
  latest_homework_title: string | null;
  latest_submitted_at: string | null;
};
type Homework = {
  id: string;
  title: string;
  description: string | null;
  lesson_name: string;
  group_id: string;
  due_date: string | null;
  is_published: boolean;
  is_expired: boolean;
  created_at: string;
  questions_count: number;
};

function formatScore(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") return "0";
  const num = Number(val);
  if (isNaN(num)) return "0";
  return Number(num.toFixed(2)).toString();
}

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
  const period = hours >= 12 ? "مساءً" : "صباحًا";
  return `${hours % 12 || 12}:${minutes} ${period}`;
}

function formatDate(date: string | null) {
  if (!date) return "من غير موعد انتهاء";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export default function TeacherGroupDetailsPage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const groupId = params.groupId;

  const [group, setGroup] = useState<GroupOverview | null>(null);
  const [students, setStudents] = useState<GroupStudent[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadPage() {
    const session = getStoredSession();
    if (!session || session.user.role !== "teacher") {
      router.replace("/login?role=teacher");
      return;
    }
    try {
      const [groupResponse, studentsResponse, homeworkResponse] = await Promise.all([
        axiosInstance.get<GroupOverview>(`/groups/${groupId}/overview`),
        axiosInstance.get<GroupStudent[]>(`/groups/${groupId}/students`),
        axiosInstance.get<Homework[]>("/homeworks"),
      ]);
      setGroup(groupResponse.data);
      setStudents(studentsResponse.data);
      setHomeworks(homeworkResponse.data.filter((homework) => homework.group_id === groupId));
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
  }, [groupId]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const query = studentSearch.trim().toLowerCase();
    return students.filter(
      (st) =>
        st.student_name.toLowerCase().includes(query) ||
        st.student_phone.includes(query) ||
        (st.student_parent_phone && st.student_parent_phone.includes(query))
    );
  }, [students, studentSearch]);

  const groupAverageScore = useMemo(() => {
    if (students.length === 0) return 0;
    const sum = students.reduce((acc, st) => acc + Number(st.score_percentage || 0), 0);
    return Math.round(sum / students.length);
  }, [students]);

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#1F2937]">
      {/* Top Header Navigation */}
      <header className="border-b-2 border-[#DCE4EF] bg-white">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1400px] items-center justify-between gap-6 py-5 max-md:flex-wrap max-md:gap-3 lg:w-[calc(100%-6rem)]">
          <Link className="text-[28px] font-black tracking-[-1.5px] text-[#173F5F]" href="/teacher">
            واجبك<span className="text-[#F6C445]">.</span>
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-4 py-2 text-[12px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F]"
            href="/teacher"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع للسناتر والمجموعات</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1400px] py-10 lg:w-[calc(100%-6rem)]">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[22px] border-2 border-[#173F5F] bg-white p-5 shadow-[4px_4px_0_#DCE4EF]">
          <div className="flex items-center gap-2 text-[13px] font-bold text-[#6B7280]">
            <Link href="/teacher" className="text-[#20639B] hover:underline font-black">
              الرئيسية
            </Link>
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span className="text-[#173F5F] font-black">{group?.center_name ?? "السنتر"}</span>
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span className="text-[#173F5F] font-black">مجموعة {group?.name ?? ""}</span>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[24px] border-2 border-[#173F5F] bg-white p-16 text-center text-[#6B7280]">
            <p className="text-[18px] font-bold">جاري تحميل بيانات وتفاصيل الحصة والمجموعة...</p>
          </div>
        ) : !group ? (
          <div className="rounded-[24px] border-2 border-[#B42318]/30 bg-[#FEF3F2] p-8 text-center font-bold text-[#B42318]">
            {error || "المجموعة غير موجودة."}
          </div>
        ) : (
          <>
            {/* Header Group Details Title */}
            <div className="mb-10 flex items-end justify-between gap-6 max-lg:flex-col max-lg:items-start border-b-2 border-[#DCE4EF] pb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] border border-[#20639B]/30 px-3.5 py-1 text-[12px] font-black text-[#20639B]">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {group.center_name} · {group.subject_name_ar}
                </span>
                <h1 className="mt-3 text-[clamp(32px,4vw,52px)] font-black leading-[1.1] tracking-[-2px] text-[#173F5F]">
                  مجموعة: {group.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold text-[#6B7280]">مواعيد الحصة الأسبوعية:</span>
                  {group.schedule_slots.map((slot) => (
                    <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[12px] font-black text-[#20639B] border border-[#20639B]/20" key={`${slot.day}-${slot.time}`}>
                      {dayLabels[slot.day]} · {formatTime(slot.time)}
                    </span>
                  ))}
                </div>
              </div>

              <span className="rounded-full bg-[#F6C445] border-2 border-[#173F5F] px-4 py-2 text-[13px] font-black text-[#173F5F]">
                مادة {group.subject_name_ar}
              </span>
            </div>

            {/* Group Summary Stat Cards */}
            <section className="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
              <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#F6C445] p-6 shadow-[5px_5px_0_#173F5F]">
                <span className="text-[13px] font-black text-[#173F5F]">إجمالي طلاب المجموعة</span>
                <strong className="mt-3 block text-[42px] font-black text-[#173F5F]">{group.students_count}</strong>
              </div>

              <div className="rounded-[24px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#DCE4EF]">
                <span className="text-[13px] font-black text-[#6B7280]">الواجبات المعينة</span>
                <strong className="mt-3 block text-[42px] font-black text-[#173F5F]">{homeworks.length}</strong>
              </div>

              <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#EFF6FF] p-6 shadow-[5px_5px_0_#20639B]">
                <span className="text-[13px] font-black text-[#20639B]">متوسط درجات الطلاب</span>
                <strong className="mt-3 block text-[42px] font-black text-[#20639B]">{groupAverageScore}%</strong>
              </div>

              <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#173F5F] p-6 text-white shadow-[5px_5px_0_#F6C445]">
                <span className="text-[13px] font-black text-[#B5C9DD]">إجمالي إجابات الواجبات</span>
                <strong className="mt-3 block text-[42px] font-black text-[#F6C445]">{group.submissions_count}</strong>
              </div>
            </section>

            {/* MAIN SECTION 1: CLASSROOM STUDENTS MONITORING TABLE */}
            <section className="mt-12 rounded-[28px] border-2 border-[#173F5F] bg-white p-8 shadow-[6px_6px_0_#173F5F]">
              <div className="flex items-center justify-between gap-6 border-b-2 border-[#DCE4EF] pb-6 max-md:flex-col max-md:items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#EFF6FF] border-2 border-[#20639B]/30 text-[#20639B]">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-[28px] font-black text-[#173F5F]">
                      قائمة متابعة الطلاب والحصة ({filteredStudents.length})
                    </h2>
                    <p className="mt-1 text-[13px] text-[#6B7280]">
                      تابع بيانات كل طالب، أرقام الهاتف وولي الأمر، وحالة الواجب ودرجته الكلية داخل الحصة وبرا الحصة.
                    </p>
                  </div>
                </div>

                {/* Search Bar for Students */}
                <div className="relative w-[320px] max-md:w-full">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#6B7280]" />
                  <input
                    type="text"
                    placeholder="ابحث باسم الطالب، تليفونه، أو تليفون ولي الأمر..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full rounded-[14px] border-2 border-[#DCE4EF] bg-[#F7F9FC] pl-9 pr-4 py-2.5 text-[13px] font-bold text-[#173F5F] outline-none focus:border-[#20639B]"
                  />
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="mt-8 rounded-[20px] border-2 border-dashed border-[#DCE4EF] p-12 text-center text-[#6B7280]">
                  <p className="text-[16px] font-bold">
                    {studentSearch ? "لا يوجد طالب يطابق البحث." : "مفيش طلاب انضموا للمجموعة دي لسه."}
                  </p>
                </div>
              ) : (
                <div className="mt-8 grid gap-4">
                  {filteredStudents.map((st, index) => {
                    const hasSolved = st.latest_status === "submitted" || st.latest_status === "graded";
                    const isGraded = st.latest_status === "graded";

                    return (
                      <article
                        key={st.student_id}
                        className="rounded-[22px] border-2 border-[#173F5F] bg-[#F7F9FC] p-5 shadow-[3px_3px_0_#DCE4EF] flex flex-wrap items-center justify-between gap-6 transition hover:border-[#20639B]"
                      >
                        {/* Student Name & Index */}
                        <div className="flex items-center gap-3.5 min-w-[220px]">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#173F5F] text-[13px] font-black text-white">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="text-[18px] font-black text-[#173F5F]">
                              {st.student_name}
                            </h3>
                            <span className="text-[11px] font-bold text-[#6B7280]">
                              كود الطالب: {st.student_id.slice(0, 8)}
                            </span>
                          </div>
                        </div>

                        {/* Contact Phones (Student & Parent) */}
                        <div className="flex flex-wrap items-center gap-3">
                          <a
                            href={`tel:${st.student_phone}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#20639B]/30 bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#173F5F] hover:bg-[#EFF6FF] transition"
                            title="الاتصال برقم الطالب"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#20639B]" />
                            <span>الطالب: <strong>{st.student_phone}</strong></span>
                          </a>

                          {st.student_parent_phone && (
                            <a
                              href={`tel:${st.student_parent_phone}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#8A6500]/40 bg-[#FFF9E8] px-3.5 py-1.5 text-[12px] font-bold text-[#8A6500] hover:bg-[#F6C445]/20 transition"
                              title="الاتصال برقم ولي الأمر"
                            >
                              <Users className="w-3.5 h-3.5 text-[#8A6500]" />
                              <span>ولي الأمر: <strong>{st.student_parent_phone}</strong></span>
                            </a>
                          )}
                        </div>

                        {/* Homework Status & Submission Date */}
                        <div className="min-w-[180px]">
                          <span className="block text-[10px] font-black text-[#6B7280] mb-1">حالة وتاريخ آخر واجب</span>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ${
                              isGraded
                                ? "bg-[#DCFCE7] text-[#15803D] border border-[#15803D]/30"
                                : hasSolved
                                  ? "bg-[#FFF9E8] text-[#8A6500] border border-[#F6C445]/60"
                                  : "bg-[#FEF2F2] text-[#B42318] border border-[#B42318]/30"
                            }`}
                          >
                            {isGraded ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                                <span>تم التصحيح ({formatScore(st.latest_score)}/{formatScore(st.latest_max_score)})</span>
                              </>
                            ) : hasSolved ? (
                              <>
                                <Clock className="w-3.5 h-3.5 text-[#8A6500]" />
                                <span>في انتظار التصحيح</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5 text-[#B42318]" />
                                <span>لم يحل الواجب</span>
                              </>
                            )}
                          </span>

                          {hasSolved && st.latest_submitted_at && (
                            <span className="block mt-1 text-[10px] font-bold text-[#20639B]">
                              تاريخ الحل: {formatDate(st.latest_submitted_at)}
                            </span>
                          )}
                        </div>

                        {/* Overall Student Score & Percentage */}
                        <div className="text-left min-w-[140px]">
                          <span className="block text-[10px] font-black text-[#6B7280]">النسبة المئوية والدرجات</span>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="rounded-full bg-[#173F5F] px-3 py-0.5 text-[13px] font-black text-[#F6C445]">
                              {st.score_percentage}%
                            </span>
                            <span className="text-[12px] font-bold text-[#173F5F]">
                              ({formatScore(st.total_score)} / {formatScore(st.total_max_score)})
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* MAIN SECTION 2: ASSIGNED HOMEWORKS LIST */}
            <section className="mt-12 rounded-[28px] border-2 border-[#173F5F] bg-[#173F5F] p-8 text-white shadow-[6px_6px_0_#F6C445]">
              <div className="flex items-center justify-between gap-4 border-b border-[#B5C9DD]/30 pb-5 max-sm:flex-col max-sm:items-start">
                <div>
                  <h2 className="text-[28px] font-black">واجبات المجموعة ({homeworks.length})</h2>
                  <p className="mt-1 text-[13px] text-[#B5C9DD]">الواجبات التي تم تعيينها لهذه المجموعة من لوحة الأدمن.</p>
                </div>
                <span className="rounded-full bg-[#F6C445] px-4 py-1.5 text-[12px] font-black text-[#173F5F]">
                  {homeworks.length} واجب متاح
                </span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-5 max-lg:grid-cols-1">
                {homeworks.length === 0 ? (
                  <p className="col-span-2 rounded-[20px] border border-[#B5C9DD]/30 p-8 text-center text-[14px] text-[#B5C9DD]">
                    لم يتم تعيين واجبات لهذه المجموعة حتى الآن.
                  </p>
                ) : (
                  homeworks.map((hw) => (
                    <article
                      className="rounded-[22px] border border-[#B5C9DD]/30 bg-white/10 p-5 flex flex-col justify-between gap-4"
                      key={hw.id}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="rounded-full bg-[#F6C445] px-3 py-0.5 text-[11px] font-black text-[#173F5F]">
                              الدرس: {hw.lesson_name}
                            </span>
                            <h3 className="mt-2 text-[20px] font-black text-white">{hw.title}</h3>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-black ${
                              hw.is_expired ? "bg-[#B42318] text-white" : hw.is_published ? "bg-[#68AB48] text-white" : "bg-[#6B7280] text-white"
                            }`}
                          >
                            {hw.is_expired ? "منتهى" : hw.is_published ? "منشور" : "مسودة"}
                          </span>
                        </div>

                        {hw.description && (
                          <p className="mt-2 text-[12px] text-[#B5C9DD] line-clamp-2">{hw.description}</p>
                        )}
                        <p className="mt-3 text-[11px] text-[#B5C9DD]">
                          ينتهي: {formatDate(hw.due_date)} · {hw.questions_count} أسئلة
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#B5C9DD]/20">
                        <Link
                          className="rounded-full border-2 border-[#B5C9DD] bg-transparent px-4 py-2.5 text-center text-[12px] font-black text-white transition hover:bg-white hover:text-[#173F5F]"
                          href={`/teacher/homeworks/${hw.id}/view`}
                        >
                          معاينة الأسئلة
                        </Link>
                        <Link
                          className="rounded-full border-2 border-[#F6C445] bg-[#F6C445] px-4 py-2.5 text-center text-[12px] font-black text-[#173F5F] transition hover:bg-white"
                          href={`/teacher/homeworks/${hw.id}/review`}
                        >
                          متابعة النتائج
                        </Link>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
