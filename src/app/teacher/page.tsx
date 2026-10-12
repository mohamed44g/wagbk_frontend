"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { axiosInstance, getApiError, getStoredSession } from "../lib/auth";
import { useToast } from "../components/ToastProvider";
import {
  Building2,
  MapPin,
  Users,
  BookOpen,
  Plus,
  Phone,
  CheckCircle2,
  Award,
  ChevronRight,
  Send,
  Copy
} from "lucide-react";

type TeacherCenter = {
  id: string;
  name: string;
  address: string | null;
};
type ScheduleSlot = {
  day: string;
  time: string;
};
type TeacherGroup = {
  id: string;
  name: string;
  academic_year: number;
  subject_name_ar: string;
  subject_name_en: string;
  students_count: number;
  schedule_slots: ScheduleSlot[];
};
type TeacherSubject = {
  id: string;
  nameAr: string;
  nameEn: string;
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
const dayValues = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "مساءً" : "صباحًا";
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<{ name: string; academicYears?: number[] } | null>(null);
  const [centers, setCenters] = useState<TeacherCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string>("");
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [centerName, setCenterName] = useState("");
  const [centerAddress, setCenterAddress] = useState("");
  const [groupName, setGroupName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [academicYear, setAcademicYear] = useState<number>(1);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([{ day: "saturday", time: "16:00" }]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const allowedYears = useMemo(() => user?.academicYears ?? [1, 2, 3], [user]);
  const adminWhatsAppUrl = useMemo(() => {
    let rawNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "01551822431";
    let cleanedNumber = rawNumber.replace(/\D/g, "");
    if (cleanedNumber.startsWith("0")) {
      cleanedNumber = "20" + cleanedNumber.slice(1);
    }
    return `https://wa.me/${cleanedNumber}`;
  }, []);

  async function loadCenters() {
    const session = getStoredSession();
    if (!session || session.user.role !== "teacher") {
      router.replace("/login?role=teacher");
      return;
    }
    setUser(session.user);
    try {
      const [centersResponse, subjectsResponse] = await Promise.all([
        axiosInstance.get<TeacherCenter[]>("/centers"),
        axiosInstance.get<TeacherSubject[]>("/subjects"),
      ]);
      setCenters(centersResponse.data);
      setSubjects(subjectsResponse.data);
      if (subjectsResponse.data.length) setSubjectId(subjectsResponse.data[0].id);
      if (session.user.academicYears?.length) setAcademicYear(session.user.academicYears[0]);
      if (centersResponse.data.length > 0) {
        const firstCenterId = centersResponse.data[0].id;
        setSelectedCenter(firstCenterId);
        await loadGroups(firstCenterId);
      }
    } catch (loadError) {
      const message = getApiError(loadError);
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  async function loadGroups(centerId: string) {
    if (!centerId) return;
    try {
      const { data } = await axiosInstance.get<TeacherGroup[]>(`/centers/${centerId}/groups`);
      setGroups(data);
    } catch (loadError) {
      const message = getApiError(loadError);
      setError(message);
      showToast({ type: "error", message });
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCenters(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCenterSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const { data } = await axiosInstance.post<TeacherCenter>("/centers", { name: centerName, address: centerAddress || undefined });
      setCenterName("");
      setCenterAddress("");
      setCenters((current) => [...current, data]);
      setSelectedCenter(data.id);
      setGroups([]);
      setMessage("تم إنشاء السنتر بنجاح.");
      showToast({ type: "success", message: "تم إرسال السنتر للنظام." });
    } catch (submitError) {
      const message = getApiError(submitError);
      setError(message);
      showToast({ type: "error", message });
    }
  }

  async function handleGroupSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!selectedCenter) {
      const message = "اختار سنتر الأول علشان تعمل المجموعة جواه.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }
    try {
      await axiosInstance.post(`/centers/${selectedCenter}/groups`, { name: groupName, subjectId, academicYear, scheduleSlots });
      setGroupName("");
      await loadGroups(selectedCenter);
      setMessage("تم إنشاء المجموعة ببيانات السنة والمادة والميعاد.");
      showToast({ type: "success", message: "تم إنشاء المجموعة ببياناتها الجديدة." });
    } catch (submitError) {
      const message = getApiError(submitError);
      setError(message);
      showToast({ type: "error", message });
    }
  }

  function addScheduleSlot() {
    if (scheduleSlots.length >= 3) return;
    const usedDays = new Set(scheduleSlots.map((slot) => slot.day));
    const nextDay = dayValues.find((day) => !usedDays.has(day)) ?? dayValues[0];
    const previousTime = scheduleSlots[scheduleSlots.length - 1]?.time ?? "16:00";
    setScheduleSlots((current) => [...current, { day: nextDay, time: previousTime }]);
  }

  function updateScheduleSlot(index: number, field: keyof ScheduleSlot, value: string) {
    setScheduleSlots((current) => current.map((slot, slotIndex) => slotIndex === index ? { ...slot, [field]: value } : slot));
  }

  function removeScheduleSlot(index: number) {
    setScheduleSlots((current) => current.filter((_, slotIndex) => slotIndex !== index));
  }

  const inputClass = "w-full rounded-[14px] border-2 border-[#DCE4EF] bg-white px-4 py-3 text-[14px] font-bold text-[#173F5F] outline-none transition focus:border-[#20639B]";

  const scheduleFields = (
    <div className="col-span-2 rounded-[16px] border-2 border-[#DCE4EF] bg-[#F7F9FC] p-4 max-md:col-span-1">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[13px] font-black text-[#173F5F]">أيام ومواعيد المجموعة</span>
        <span className="text-[11px] font-bold text-[#6B7280]">{scheduleSlots.length}/3</span>
      </div>
      <div className="grid gap-3">
        {scheduleSlots.map((slot, index) => (
          <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3 max-sm:grid-cols-1" key={`${slot.day}-${index}`}>
            <label className="text-[12px] font-black text-[#173F5F]">
              اليوم {index + 1}
              <select className={inputClass} onChange={(event) => updateScheduleSlot(index, "day", event.target.value)} value={slot.day}>
                {dayValues.map((day) => <option key={day} value={day}>{dayLabels[day]}</option>)}
              </select>
            </label>
            <label className="text-[12px] font-black text-[#173F5F]">
              الميعاد
              <input className={inputClass} onChange={(event) => updateScheduleSlot(index, "time", event.target.value)} required type="time" value={slot.time} />
            </label>
            {index > 0 && <button className="rounded-[14px] border-2 border-[#B42318] bg-white px-3 py-3 text-[12px] font-black text-[#B42318] transition hover:bg-[#FEF3F2]" onClick={() => removeScheduleSlot(index)} type="button">حذف</button>}
          </div>
        ))}
      </div>
      {scheduleSlots.length < 3 && (
        <button className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-[#173F5F] bg-white px-4 py-2 text-[12px] font-black text-[#173F5F] shadow-[2px_2px_0_#173F5F] transition hover:translate-y-0.5 cursor-pointer" onClick={addScheduleSlot} type="button">
          <Plus className="w-3.5 h-3.5 text-[#20639B]" />
          <span>إضافة يوم تاني</span>
        </button>
      )}
      <p className="mt-2 text-[11px] text-[#6B7280]">اليوم الجديد بياخد ميعاد الصف اللي قبله تلقائيًا، وتقدر تعدله.</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#1F2937]">
      <header className="border-b-2 border-[#DCE4EF] bg-white">
        <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1400px] items-center justify-between gap-6 py-5 max-md:flex-wrap max-md:gap-3 lg:w-[calc(100%-6rem)]">
          <Link className="text-[28px] font-black tracking-[-1.5px] text-[#173F5F]" href="/">واجبك<span className="text-[#F6C445]">.</span></Link>
          <div className="flex items-center gap-3 max-sm:w-full max-sm:flex-wrap max-sm:justify-end">
            <div className="hidden text-right sm:block">
              <p className="text-[12px] font-bold text-[#6B7280]">أهلاً {user?.name ?? ""}</p>
              <strong className="text-[15px] text-[#173F5F]">مدرس</strong>
            </div>
            <Link aria-label="التواصل مع الأدمن عبر واتساب" className="whitespace-nowrap rounded-full border-2 border-[#128C7E] bg-[#25D366] px-4 py-2 text-[12px] font-black text-white shadow-[3px_3px_0_#128C7E] transition hover:translate-y-0.5 hover:shadow-[1px_1px_0_#128C7E]" href={adminWhatsAppUrl} rel="noreferrer" target="_blank">تواصل مع الأدمن</Link>
            <Link className="whitespace-nowrap rounded-full border-2 border-[#173F5F] bg-[#20639B] px-4 py-2 text-[12px] font-black text-white" href="/teacher/evaluations/weekly">التقييم الأسبوعي</Link>
            <button className="whitespace-nowrap rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-4 py-2 text-[12px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F]" onClick={() => { window.localStorage.clear(); router.push("/login?role=teacher"); }} type="button">خروج</button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1400px] py-10 lg:w-[calc(100%-6rem)]">
        {/* Sleek Modern Header Title Row */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-6 pb-6 border-b-2 border-[#DCE4EF]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border-2 border-[#20639B]/30 bg-[#EFF6FF] text-[#20639B] shadow-[3px_3px_0_#20639B]">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#EFF6FF] border border-[#20639B]/30 px-3 py-0.5 text-[11px] font-black text-[#20639B]">
                  لوحة المدرس
                </span>
                {user?.name && (
                  <span className="text-[12px] font-bold text-[#6B7280]">
                    أهلاً {user.name}
                  </span>
                )}
              </div>
              <h1 className="mt-1.5 text-[28px] font-black tracking-[-0.5px] text-[#173F5F]">
                إدارة المجموعات والسناتر
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-[#6B7280]">
                <span>المراحل المسموح لك تدريسها:</span>
                {allowedYears.map((year) => (
                  <span key={year} className="rounded-full bg-[#FFF9E8] px-2.5 py-0.5 text-[11px] font-black text-[#8A6500] border border-[#F6C445]/60">
                    {yearLabels[year]}
                  </span>
                ))}
              </p>
            </div>
          </div>

          {/* Premium Center Selector Card */}
          <div className="flex items-center gap-3 rounded-[20px] border-2 border-[#173F5F] bg-white px-4 py-3 shadow-[4px_4px_0_#DCE4EF]">
            <MapPin className="h-5 w-5 text-[#8A6500]" />
            <div>
              <span className="block text-[10px] font-black text-[#6B7280]">السنتر الحالي</span>
              <select
                aria-label="اختار السنتر"
                className="mt-0.5 rounded-lg bg-transparent text-[13px] font-black text-[#173F5F] outline-none cursor-pointer"
                disabled={loading || centers.length === 0}
                onChange={(event) => { setSelectedCenter(event.target.value); void loadGroups(event.target.value); }}
                value={selectedCenter}
              >
                <option value="">اختار سنتر...</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>{center.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {(message || error) && (
          <p className={message ? "mb-6 rounded-[14px] border-2 border-[#68AB48]/30 bg-[#F0FDF4] px-4 py-3 text-[14px] font-bold text-[#27743A]" : "mb-6 rounded-[14px] border-2 border-[#B42318]/25 bg-[#FEF3F2] px-4 py-3 text-[14px] font-bold text-[#B42318]"}>
            {message || error}
          </p>
        )}

        <div className="grid grid-cols-[.75fr_1.25fr] items-start gap-6 max-lg:grid-cols-1">
          {/* Create Center Card */}
          <section className="rounded-[26px] border-2 border-[#173F5F] bg-[#F6C445] p-6 shadow-[5px_5px_0_#173F5F]">
            <h2 className="text-[24px] font-black text-[#173F5F]">سنتر جديد</h2>
            <p className="mt-2 text-[13px] leading-[1.8] text-[#173F5F]">اعمل سنتر تجمع فيه مجموعاتك.</p>
            <form className="mt-6 grid gap-4" onSubmit={handleCenterSubmit}>
              <label className="text-[13px] font-black text-[#173F5F]">
                اسم السنتر
                <input className={inputClass} onChange={(event) => setCenterName(event.target.value)} placeholder="سنتر النخبة" required value={centerName} />
              </label>
              <label className="text-[13px] font-black text-[#173F5F]">
                العنوان
                <input className={inputClass} onChange={(event) => setCenterAddress(event.target.value)} placeholder="العنوان اختياري" value={centerAddress} />
              </label>
              <button className="rounded-full border-2 border-[#173F5F] bg-white px-5 py-3 text-[13px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F] cursor-pointer hover:bg-[#F7F9FC] transition" type="submit">
                إنشاء السنتر
              </button>
            </form>
          </section>

          {/* Create Group Card */}
          <section className="rounded-[26px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#DCE4EF]">
            <div>
              <h2 className="text-[24px] font-black text-[#173F5F]">مجموعة جديدة</h2>
              <p className="mt-2 text-[13px] text-[#6B7280]">كل مجموعة مرتبطة بسنة ومادة وأكتر من ميعاد أسبوعي.</p>
            </div>

            <label className="mt-6 block text-[13px] font-black text-[#173F5F]">
              المادة
              <select className={inputClass} onChange={(event) => setSubjectId(event.target.value)} value={subjectId}>
                <option value="">اختار المادة</option>
                {subjects.map((subjectOption) => (
                  <option key={subjectOption.id} value={subjectOption.id}>{subjectOption.nameAr} - {subjectOption.nameEn}</option>
                ))}
              </select>
            </label>

            <form className="mt-4 grid grid-cols-2 gap-4 max-md:grid-cols-1" onSubmit={handleGroupSubmit}>
              <label className="text-[13px] font-black text-[#173F5F]">
                اسم المجموعة
                <input className={inputClass} onChange={(event) => setGroupName(event.target.value)} placeholder="مجموعة A" required value={groupName} />
              </label>

              <label className="text-[13px] font-black text-[#173F5F]">
                السنة الدراسية
                <select className={inputClass} onChange={(event) => setAcademicYear(Number(event.target.value))} value={academicYear}>
                  {allowedYears.map((year) => (
                    <option key={year} value={year}>{year} - {yearLabels[year]}</option>
                  ))}
                </select>
              </label>

              {scheduleFields}

              <button className="self-end rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-5 py-3 text-[13px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F] disabled:opacity-50 cursor-pointer hover:bg-[#F3B926] transition" disabled={!selectedCenter || !subjectId} type="submit">
                إنشاء المجموعة
              </button>
            </form>
          </section>
        </div>

        {/* Groups List Section */}
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
            <h2 className="text-[28px] font-black text-[#173F5F]">مجموعاتك</h2>
            <span className="text-[13px] font-bold text-[#6B7280]">
              {selectedCenter ? `السنتر الحالي: ${centers.find((center) => center.id === selectedCenter)?.name}` : "اختار سنتر من أعلى الصفحة"}
            </span>
          </div>

          {groups.length === 0 ? (
            <p className="rounded-[20px] border-2 border-dashed border-[#DCE4EF] bg-white p-10 text-center text-[#6B7280]">مفيش مجموعات في السنتر ده لسه.</p>
          ) : (
            <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-2 max-md:grid-cols-1">
              {groups.map((group) => (
                <article className="rounded-[22px] border-2 border-[#173F5F] bg-white p-5 shadow-[4px_4px_0_#DCE4EF] flex flex-col justify-between" key={group.id}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#F6C445] px-3 py-1 text-[11px] font-black text-[#173F5F]">{yearLabels[group.academic_year]}</span>
                      <span className="text-[12px] font-bold text-[#68AB48] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{group.students_count} طالب</span>
                      </span>
                    </div>

                    <h3 className="mt-5 text-[21px] font-black text-[#173F5F]">{group.name}</h3>
                    <p className="mt-2 text-[14px] font-bold text-[#20639B]">{group.subject_name_ar} - {group.subject_name_en}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.schedule_slots.map((slot) => (
                        <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[12px] font-bold text-[#20639B]" key={slot.day}>{dayLabels[slot.day]} - {formatTime(slot.time)}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 border-t-2 border-[#DCE4EF] pt-4 grid grid-cols-2 gap-2">
                    <Link className="rounded-full border-2 border-[#173F5F] bg-white px-3 py-2 text-center text-[11px] font-black text-[#173F5F] transition hover:bg-[#EFF6FF]" href={`/teacher/groups/${group.id}/students`}>
                      عرض طلبة المجموعة
                    </Link>
                    <Link className="rounded-full border-2 border-[#173F5F] bg-[#173F5F] px-3 py-2 text-center text-[11px] font-black text-white transition hover:bg-[#20639B]" href={`/teacher/groups/${group.id}`}>
                      دخول المجموعة
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
