"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance, getApiError, getStoredSession } from "../../../../lib/auth";
import { useToast } from "../../../../components/ToastProvider";

type Student = {
  student_id: string;
  student_name: string;
  student_phone: string;
  student_parent_phone: string | null;
};

type Group = {
  name: string;
  center_name: string;
  subject_name_ar: string;
  subject_name_en: string;
  academic_year: number;
};

const yearLabels: Record<number, string> = { 1: "أولى ثانوي", 2: "تانية ثانوي", 3: "تالتة ثانوي" };

export default function TeacherGroupStudentsPage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const session = getStoredSession();
      if (!session || session.user.role !== "teacher") {
        router.replace("/login?role=teacher");
        return;
      }

      void (async () => {
        try {
          const [groupResponse, studentsResponse] = await Promise.all([
            axiosInstance.get<Group>(`/groups/${params.groupId}/overview`),
            axiosInstance.get<Student[]>(`/groups/${params.groupId}/students`),
          ]);
          setGroup(groupResponse.data);
          setStudents(studentsResponse.data);
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
  }, [params.groupId, router, showToast]);

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#1F2937]">
      <header className="border-b-2 border-[#DCE4EF] bg-white">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1400px] items-center justify-between gap-5 py-5 max-md:flex-wrap max-md:gap-3 lg:w-[calc(100%-6rem)]">
          <Link className="text-[28px] font-black tracking-[-1.5px] text-[#173F5F]" href="/teacher">واجبك<span className="text-[#F6C445]">.</span></Link>
          <Link className="rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-4 py-2 text-[12px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F]" href={`/teacher/groups/${params.groupId}`}>رجوع للمجموعة</Link>
        </div>
      </header>

      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1100px] py-12 lg:w-[calc(100%-6rem)]">
        {loading ? (
          <p className="rounded-[22px] bg-white p-12 text-center text-[#6B7280]">جاري تحميل طلبة المجموعة...</p>
        ) : !group ? (
          <p className="rounded-[22px] border-2 border-[#B42318]/30 bg-[#FEF3F2] p-8 text-center font-bold text-[#B42318]">{error || "المجموعة غير موجودة."}</p>
        ) : (
          <>
            <section className="flex items-end justify-between gap-6 max-md:flex-col max-md:items-start" data-aos="fade-up">
              <div>
                <p className="mb-3 text-[14px] font-black text-[#20639B]">{group.center_name} · {group.subject_name_ar}</p>
                <h1 className="text-[clamp(36px,5vw,64px)] font-black leading-[1.1] tracking-[-2px] text-[#173F5F]">طلبة {group.name}</h1>
                <p className="mt-4 text-[16px] text-[#6B7280]">{group.subject_name_ar} - {group.subject_name_en} · {yearLabels[group.academic_year]}</p>
              </div>
              <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#F6C445] px-7 py-5 text-center shadow-[5px_5px_0_#173F5F]">
                <span className="block text-[12px] font-black text-[#173F5F]">إجمالي الطلبة</span>
                <strong className="mt-1 block text-[42px] font-black leading-none text-[#173F5F]">{students.length}</strong>
              </div>
            </section>

            {error && <p className="mt-8 rounded-[16px] border-2 border-[#B42318]/25 bg-[#FEF3F2] px-4 py-3 text-[14px] font-bold text-[#B42318]">{error}</p>}

            <section className="mt-10 rounded-[26px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#DCE4EF]" data-aos="fade-up">
              <div className="flex items-center justify-between gap-4 border-b-2 border-[#DCE4EF] pb-5 max-sm:flex-col max-sm:items-start">
                <div><p className="text-[12px] font-bold text-[#6B7280]">قائمة المجموعة</p><h2 className="mt-1 text-[26px] font-black text-[#173F5F]">كل الطلبة المشتركين</h2></div>
                <span className="rounded-full bg-[#EAF7E5] px-3 py-2 text-[11px] font-black text-[#27743A]">{students.length} طالب</span>
              </div>
              {students.length === 0 ? (
                <p className="mt-6 rounded-[18px] border-2 border-dashed border-[#DCE4EF] p-10 text-center text-[14px] font-bold text-[#6B7280]">لسه مفيش طلبة انضموا للمجموعة.</p>
              ) : (
                <div className="mt-6 overflow-x-auto rounded-[18px] border-2 border-[#DCE4EF]">
                  <table className="w-full min-w-[760px] border-collapse text-right">
                    <thead className="bg-[#173F5F] text-white">
                      <tr><th className="px-5 py-4 text-[12px] font-black">#</th><th className="px-5 py-4 text-[12px] font-black">اسم الطالب</th><th className="px-5 py-4 text-[12px] font-black">رقم الطالب</th><th className="px-5 py-4 text-[12px] font-black">رقم ولي الأمر</th><th className="px-5 py-4 text-[12px] font-black">الحالة</th></tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr className="border-t-2 border-[#DCE4EF] bg-white transition hover:bg-[#F7F9FC]" key={student.student_id}>
                          <td className="px-5 py-4 text-[12px] font-black text-[#20639B]">{String(index + 1).padStart(2, "0")}</td>
                          <td className="px-5 py-4 text-[14px] font-black text-[#173F5F]">{student.student_name}</td>
                          <td className="px-5 py-4 text-[12px] font-bold text-[#6B7280]">{student.student_phone}</td>
                          <td className="px-5 py-4 text-[12px] font-bold text-[#20639B]">{student.student_parent_phone ?? "غير مسجل"}</td>
                          <td className="px-5 py-4"><span className="rounded-full bg-[#EAF7E5] px-3 py-2 text-[10px] font-black text-[#27743A]">مشترك</span></td>
                        </tr>
                      ))}
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
