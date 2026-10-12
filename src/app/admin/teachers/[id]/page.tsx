"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance, getApiError, getStoredSession } from "../../../lib/auth";
import { useToast } from "../../../components/ToastProvider";
import {
  Users,
  BookOpen,
  Phone,
  Mail,
  GraduationCap,
  Building2,
  Calendar,
  ArrowRight,
  ArrowLeft,
  ChevronRight
} from "lucide-react";

type ScheduleSlot = { day: string; time: string };

type TeacherDetail = {
  teacher: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    is_active: boolean;
    created_at: string;
    centers_count: number;
    groups_count: number;
    students_count: number;
    subjects: { id: string; name_ar: string; name_en: string }[];
    academic_years: number[];
  };
  centers: {
    center_id: string;
    center_name: string;
    center_address: string | null;
    groups: {
      id: string;
      name: string;
      academic_year: number;
      subject_name_ar: string;
      schedule_slots: ScheduleSlot[];
      students_count: number;
    }[];
  }[];
};

const dayLabels: Record<string, string> = {
  saturday: "السبت",
  sunday: "الأحد",
  monday: "الاتنين",
  tuesday: "التلات",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
};

function formatTime(time: string) {
  if (!time) return "";
  const [hoursText, minutes] = time.slice(0, 5).split(":");
  const hours = Number(hoursText);
  return `${hours % 12 || 12}:${minutes} ${hours >= 12 ? "PM" : "AM"}`;
}

function getYearLabel(year: number) {
  if (year === 1) return "أولى ثانوي";
  if (year === 2) return "تانية ثانوي";
  if (year === 3) return "تالتة ثانوي";
  return `الصف ${year}`;
}

export default function AdminTeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const teacherId = params.id as string;

  const [teacherDetail, setTeacherDetail] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getStoredSession();
    if (!session || session.user.role !== "super_admin") {
      router.replace("/login");
      return;
    }

    if (!teacherId) return;

    void axiosInstance
      .get<TeacherDetail>(`/admin/teachers/${teacherId}`)
      .then((res) => {
        setTeacherDetail(res.data);
      })
      .catch((err) => {
        const message = getApiError(err);
        setError(message);
        showToast({ type: "error", message });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [teacherId, router, showToast]);

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
            <Link href="/admin" className="text-[#20639B] hover:underline font-black">
              دليل المدرسين
            </Link>
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span className="text-[#173F5F] font-black">
              {teacherDetail?.teacher.name ?? "تفاصيل المدرس"}
            </span>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-5 py-2 text-[13px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F] hover:bg-[#F3B926]"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لقائمة المدرسين</span>
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[24px] border-2 border-[#173F5F] bg-white p-16 text-center text-[#6B7280]">
            <p className="text-[18px] font-bold">جاري تحميل بيانات المدرس ومجموعاته...</p>
          </div>
        ) : error ? (
          <div className="rounded-[24px] border-2 border-[#B42318]/25 bg-[#FEF3F2] p-8 text-center text-[#B42318]">
            <p className="text-[16px] font-bold">{error}</p>
          </div>
        ) : teacherDetail ? (
          <div className="rounded-[28px] border-2 border-[#173F5F] bg-white p-8 shadow-[6px_6px_0_#173F5F]">
            {/* Teacher Profile Summary Header */}
            <div className="mb-8 border-b-2 border-[#DCE4EF] pb-6 flex flex-wrap items-center justify-between gap-6">
              <div>
                <span className="rounded-full bg-[#EFF6FF] border border-[#20639B]/30 px-3.5 py-1 text-[12px] font-black text-[#20639B]">
                  مدرس نشط بالمنصة
                </span>
                <h1 className="mt-3 text-[36px] font-black text-[#173F5F]">
                  {teacherDetail.teacher.name}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-3 text-[15px] font-bold text-[#6B7280]">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#20639B]" />
                    رقم الهاتف:{" "}
                    <a href={`tel:${teacherDetail.teacher.phone}`} className="text-[#20639B] hover:underline font-black">
                      {teacherDetail.teacher.phone}
                    </a>
                  </span>
                  {teacherDetail.teacher.email && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-[#20639B]" />
                        البريد: {teacherDetail.teacher.email}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-[18px] border-2 border-[#173F5F] bg-[#F7F9FC] p-4 text-center min-w-[120px]">
                  <span className="text-[11px] font-bold text-[#6B7280]">المراكز</span>
                  <strong className="mt-1 block text-[26px] font-black text-[#173F5F]">{teacherDetail.teacher.centers_count}</strong>
                </div>
                <div className="rounded-[18px] border-2 border-[#173F5F] bg-[#FFF9E8] p-4 text-center min-w-[120px]">
                  <span className="text-[11px] font-bold text-[#8A6500]">المجموعات</span>
                  <strong className="mt-1 block text-[26px] font-black text-[#173F5F]">{teacherDetail.teacher.groups_count}</strong>
                </div>
                <div className="rounded-[18px] border-2 border-[#173F5F] bg-[#EFF6FF] p-4 text-center min-w-[140px]">
                  <span className="text-[11px] font-bold text-[#20639B]">الطلاب المسجلين</span>
                  <strong className="mt-1 block text-[26px] font-black text-[#20639B]">{teacherDetail.teacher.students_count}</strong>
                </div>
              </div>
            </div>

            {/* Subject & Academic Years Registered */}
            <div className="mb-8 rounded-[20px] border-2 border-[#DCE4EF] bg-[#F7F9FC] p-5">
              <h3 className="text-[15px] font-black text-[#173F5F]">التخصص والسنوات الدراسية المسجل بها المدرس:</h3>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {teacherDetail.teacher.subjects.map((sub) => (
                  <span key={sub.id} className="inline-flex items-center gap-1.5 rounded-full bg-white border-2 border-[#173F5F] px-4 py-1.5 text-[13px] font-black text-[#173F5F]">
                    <BookOpen className="w-4 h-4 text-[#20639B]" />
                    <span>{sub.name_ar} ({sub.name_en})</span>
                  </span>
                ))}
                {teacherDetail.teacher.academic_years.map((yr) => (
                  <span key={yr} className="inline-flex items-center gap-1.5 rounded-full bg-[#F6C445] border-2 border-[#173F5F] px-4 py-1.5 text-[13px] font-black text-[#173F5F]">
                    <GraduationCap className="w-4 h-4" />
                    <span>{getYearLabel(yr)}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Centers & Groups View */}
            <div>
              <h2 className="text-[26px] font-black text-[#173F5F] mb-6">
                المراكز والمجموعات المضافة للمدرس:
              </h2>

              {teacherDetail.centers.length === 0 ? (
                <div className="rounded-[20px] border-2 border-dashed border-[#DCE4EF] p-12 text-center text-[#6B7280]">
                  <p className="text-[16px] font-bold">لم يقم هذا المدرس بإنشاء أي مراكز أو مجموعات بعد.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {teacherDetail.centers.map((center) => (
                    <div key={center.center_id} className="rounded-[24px] border-2 border-[#173F5F] bg-white p-6 shadow-[4px_4px_0_#DCE4EF]">
                      <div className="flex items-center justify-between gap-4 border-b-2 border-[#DCE4EF] pb-4">
                        <div>
                          <h3 className="inline-flex items-center gap-2 text-[22px] font-black text-[#173F5F]">
                            <Building2 className="w-5 h-5 text-[#20639B]" />
                            <span>سنتر: {center.center_name}</span>
                          </h3>
                          {center.center_address && <p className="mt-1 text-[13px] font-bold text-[#6B7280]">العنوان: {center.center_address}</p>}
                        </div>
                        <span className="rounded-full bg-[#EFF6FF] border border-[#20639B]/30 px-4 py-1.5 text-[12px] font-black text-[#20639B]">
                          {center.groups.length} مجموعات داخل السنتر
                        </span>
                      </div>

                      {center.groups.length === 0 ? (
                        <p className="mt-4 text-[13px] text-[#6B7280]">لا توجد مجموعات تابعة لهذا السنتر حالياً.</p>
                      ) : (
                        <div className="mt-6 grid grid-cols-2 gap-5 max-md:grid-cols-1">
                          {center.groups.map((group) => (
                            <div key={group.id} className="rounded-[20px] border-2 border-[#20639B]/40 bg-[#F7F9FC] p-5 flex flex-col justify-between shadow-[3px_3px_0_#DCE4EF]">
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-[18px] font-black text-[#173F5F]">{group.name}</h4>
                                  <span className="rounded-full bg-[#FFF9E8] border border-[#F6C445]/60 px-3 py-1 text-[11px] font-black text-[#8A6500]">
                                    {getYearLabel(group.academic_year)}
                                  </span>
                                </div>
                                <p className="mt-2 text-[13px] font-bold text-[#20639B]">مادة {group.subject_name_ar}</p>
                                <p className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-[#6B7280]">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>مواعيد الحصص: {group.schedule_slots?.map((s) => `${dayLabels[s.day]} الساعة ${formatTime(s.time)}`).join("، ") || "لم يُحدد"}</span>
                                </p>
                              </div>

                              <div className="mt-6 flex items-center justify-between gap-3 border-t-2 border-[#DCE4EF] pt-4">
                                <span className="inline-flex items-center gap-1.5 text-[13px] font-black text-[#173F5F]">
                                  <Users className="w-4 h-4 text-[#20639B]" />
                                  <span>{group.students_count} طالب متسجل</span>
                                </span>
                                <Link
                                  href={`/admin/groups/${group.id}/students`}
                                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-4 py-2 text-[12px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F] hover:bg-[#F3B926]"
                                >
                                  <span>عرض الطلاب والتقييم</span>
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
