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
  GraduationCap,
  Building2,
  ArrowRight,
  ChevronRight,
  Search
} from "lucide-react";

type GroupStudentDetail = {
  group: {
    id: string;
    name: string;
    teacher_id: string;
    teacher_name: string;
    center_id: string;
    center_name: string;
    subject_name_ar: string;
    academic_year: number;
  };
  students: {
    id: string;
    name: string;
    phone: string;
    parent_phone: string | null;
    academic_year: number;
    joined_at: string;
    submissions_count: number;
    total_score: number;
    total_max_score: number;
    score_percentage: number;
  }[];
};

function formatScore(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") return "0";
  const num = Number(val);
  if (isNaN(num)) return "0";
  return Number(num.toFixed(2)).toString();
}

function getYearLabel(year: number) {
  if (year === 1) return "أولى ثانوي";
  if (year === 2) return "تانية ثانوي";
  if (year === 3) return "تالتة ثانوي";
  return `الصف ${year}`;
}

export default function AdminGroupStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const groupId = params.id as string;

  const [groupStudentsDetail, setGroupStudentsDetail] = useState<GroupStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const session = getStoredSession();
    if (!session || session.user.role !== "super_admin") {
      router.replace("/login");
      return;
    }

    if (!groupId) return;

    setLoading(true);
    axiosInstance
      .get<GroupStudentDetail>(`/admin/groups/${groupId}/students`)
      .then((res) => {
        setGroupStudentsDetail(res.data);
      })
      .catch((err) => {
        const message = getApiError(err);
        setError(message);
        showToast({ type: "error", message });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [groupId, router, showToast]);

  const teacherBackUrl = groupStudentsDetail
    ? `/admin/teachers/${groupStudentsDetail.group.teacher_id}`
    : "/admin";

  const filteredStudents = useMemo(() => {
    if (!groupStudentsDetail?.students) return [];
    if (!searchQuery.trim()) return groupStudentsDetail.students;
    const query = searchQuery.trim().toLowerCase();
    return groupStudentsDetail.students.filter(
      (st) =>
        st.name.toLowerCase().includes(query) ||
        st.phone.includes(query) ||
        (st.parent_phone && st.parent_phone.includes(query))
    );
  }, [groupStudentsDetail, searchQuery]);

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#1F2937]">
      <header className="border-b-2 border-[#DCE4EF] bg-white">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1400px] items-center justify-between gap-6 py-5 max-md:flex-wrap max-md:gap-3 lg:w-[calc(100%-6rem)]">
          <Link className="text-[28px] font-black tracking-[-1.5px] text-[#173F5F]" href="/">
            واجبك<span className="text-[#F6C445]">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#EFF6FF] px-4 py-2 text-[12px] font-black text-[#20639B]">لوحة الأدمن</span>
            <button
              className="rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-4 py-2 text-[12px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F]"
              onClick={() => {
                window.localStorage.clear();
                router.push("/login");
              }}
              type="button"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1400px] py-12 lg:w-[calc(100%-6rem)]">
        {/* Breadcrumb Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[22px] border-2 border-[#173F5F] bg-white p-5 shadow-[4px_4px_0_#DCE4EF]">
          <div className="flex items-center gap-2 text-[13px] font-bold text-[#6B7280]">
            <Link href="/admin" className="text-[#20639B] hover:underline font-black">
              لوحة التحكم
            </Link>
            <ChevronRight className="w-4 h-4 rotate-180" />
            {groupStudentsDetail && (
              <>
                <Link href={teacherBackUrl} className="text-[#20639B] hover:underline font-black">
                  مدرس: {groupStudentsDetail.group.teacher_name}
                </Link>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </>
            )}
            <span className="text-[#173F5F] font-black">طلاب المجموعة</span>
          </div>

          <Link
            href={teacherBackUrl}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-5 py-2 text-[13px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F] hover:bg-[#F3B926]"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لتفاصيل المدرس</span>
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[24px] border-2 border-[#173F5F] bg-white p-16 text-center text-[#6B7280]">
            <p className="text-[18px] font-bold">جاري تحميل بيانات المجموعة والطلاب...</p>
          </div>
        ) : error ? (
          <div className="rounded-[24px] border-2 border-[#B42318]/25 bg-[#FEF3F2] p-8 text-center text-[#B42318]">
            <p className="text-[16px] font-bold">{error}</p>
          </div>
        ) : groupStudentsDetail ? (
          <div className="grid gap-8">
            {/* Group Summary Header Card */}
            <div className="rounded-[28px] border-2 border-[#173F5F] bg-white p-8 shadow-[6px_6px_0_#173F5F]">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] border border-[#20639B]/30 px-3.5 py-1 text-[12px] font-black text-[#20639B]">
                    <Users className="w-3.5 h-3.5" />
                    مجموعة طلابية
                  </span>
                  <h1 className="mt-3 text-[36px] font-black text-[#173F5F]">
                    {groupStudentsDetail.group.name}
                  </h1>
                  <p className="mt-2 flex flex-wrap items-center gap-3 text-[14px] font-bold text-[#6B7280]">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4 text-[#173F5F]" />
                      المدرس: <strong className="text-[#173F5F]">{groupStudentsDetail.group.teacher_name}</strong>
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-4 h-4 text-[#173F5F]" />
                      السنتر: <strong className="text-[#173F5F]">{groupStudentsDetail.group.center_name}</strong>
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-[#20639B]" />
                      المادة: <strong className="text-[#20639B]">{groupStudentsDetail.group.subject_name_ar}</strong>
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="w-4 h-4 text-[#8A6500]" />
                      السنة: <strong className="text-[#8A6500]">{getYearLabel(groupStudentsDetail.group.academic_year)}</strong>
                    </span>
                  </p>
                </div>

                <div className="rounded-[20px] border-2 border-[#173F5F] bg-[#FFF9E8] p-5 text-center min-w-[170px] shadow-[3px_3px_0_#F6C445]">
                  <span className="text-[13px] font-black text-[#8A6500]">الطلاب المسجلين</span>
                  <strong className="mt-1 block text-[32px] font-black text-[#173F5F]">
                    {groupStudentsDetail.students.length}
                  </strong>
                </div>
              </div>
            </div>

            {/* Students List Table */}
            <section className="rounded-[28px] border-2 border-[#173F5F] bg-white p-8 shadow-[6px_6px_0_#173F5F]">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#DCE4EF] pb-5">
                <div>
                  <h2 className="text-[26px] font-black text-[#173F5F]">
                    قائمة الطلاب المسجلين بالمجموعة ({filteredStudents.length})
                  </h2>
                  <p className="mt-1 text-[13px] text-[#6B7280]">
                    بيانات الطلاب، أرقام الهاتف وولي الأمر، وإجمالي التقييم والنسبة المئوية.
                  </p>
                </div>

                <div className="relative w-[300px] max-md:w-full">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#6B7280]" />
                  <input
                    type="text"
                    placeholder="ابحث باسم الطالب، تليفونه، أو تليفون ولي الأمر..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-[14px] border-2 border-[#DCE4EF] bg-[#F7F9FC] pl-9 pr-4 py-2.5 text-[13px] font-bold text-[#173F5F] outline-none focus:border-[#20639B]"
                  />
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="mt-8 rounded-[20px] border-2 border-dashed border-[#DCE4EF] p-12 text-center text-[#6B7280]">
                  <p className="text-[16px] font-bold">
                    {searchQuery ? "لا يوجد طالب يطابق البحث." : "لا يوجد طلاب انضموا لهذه المجموعة حتى الآن."}
                  </p>
                </div>
              ) : (
                <div className="mt-8 overflow-x-auto rounded-[20px] border-2 border-[#173F5F]">
                  <table className="w-full min-w-[800px] border-collapse text-right">
                    <thead className="bg-[#173F5F] text-white">
                      <tr>
                        <th className="px-5 py-4 text-[13px] font-black">#</th>
                        <th className="px-5 py-4 text-[13px] font-black">اسم الطالب</th>
                        <th className="px-5 py-4 text-[13px] font-black">رقم الطالب</th>
                        <th className="px-5 py-4 text-[13px] font-black">رقم ولي الأمر</th>
                        <th className="px-5 py-4 text-[13px] font-black">الواجبات المسلمة</th>
                        <th className="px-5 py-4 text-[13px] font-black">الدرجات والنسبة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, index) => (
                        <tr
                          key={student.id}
                          className="border-t-2 border-[#DCE4EF] bg-white transition hover:bg-[#F7F9FC]"
                        >
                          <td className="px-5 py-4 text-[13px] font-black text-[#20639B]">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="px-5 py-4 font-black text-[#173F5F] text-[15px]">
                            {student.name}
                          </td>
                          <td className="px-5 py-4 text-[13px] font-bold text-[#6B7280]">
                            <a href={`tel:${student.phone}`} className="inline-flex items-center gap-1 hover:text-[#20639B]">
                              <Phone className="w-3.5 h-3.5 text-[#20639B]" />
                              <span>{student.phone}</span>
                            </a>
                          </td>
                          <td className="px-5 py-4 text-[13px] font-bold text-[#8A6500]">
                            {student.parent_phone ? (
                              <a href={`tel:${student.parent_phone}`} className="inline-flex items-center gap-1 hover:underline">
                                <Users className="w-3.5 h-3.5 text-[#8A6500]" />
                                <span>{student.parent_phone}</span>
                              </a>
                            ) : (
                              "غير مسجل"
                            )}
                          </td>
                          <td className="px-5 py-4 text-[13px] font-bold text-[#173F5F]">
                            {student.submissions_count} واجب
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-2 rounded-full bg-[#173F5F] px-3 py-1 text-[12px] font-black text-[#F6C445]">
                              {student.score_percentage}% ({formatScore(student.total_score)} / {formatScore(student.total_max_score)})
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
