"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { axiosInstance, getApiError, getStoredSession } from "../lib/auth";
import { useToast } from "../components/ToastProvider";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  Phone,
  Mail,
  GraduationCap,
  ArrowLeft,
  FileSpreadsheet,
  Plus,
  Send,
  Search,
  ChevronRight,
  PenTool,
  Award,
  RotateCcw,
  CheckCircle2,
  Eye,
  Save,
  AlertCircle,
  Clock,
  Zap,
  Copy
} from "lucide-react";

type QuestionType = "mcq" | "true_false" | "essay";
type QuestionDraft = {
  type: QuestionType;
  text: string;
  points: number;
  choices: string[];
  correctChoice: number;
  correctBoolean: boolean;
  isOpen: boolean;
};
type ImportedQuestion = {
  type: QuestionType;
  text: string;
  points: number;
  correctBoolean?: boolean;
  choices?: { text: string; isCorrect: boolean; orderIndex: number }[];
};
type AdminHomework = {
  id: string;
  title: string;
  description: string | null;
  lesson_name: string;
  questions_count: number;
  is_active: boolean;
};
type ScheduleSlot = { day: string; time: string };
type AdminGroup = {
  id: string;
  name: string;
  teacher_id: string;
  teacher_name: string;
  center_name: string;
  subject_name_ar: string;
  students_count: number;
  schedule_slots?: ScheduleSlot[];
};

type AdminTeacher = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  governorate: string;
  created_at: string;
  subjects: { name_ar: string; name_en: string }[];
  centers_count: number;
  groups_count: number;
  students_count: number;
};

type AccessCodeItem = {
  id: string;
  code: string;
  is_active: boolean;
  used_count: number;
  max_uses: number;
  created_at: string;
  used_by_student_name?: string | null;
  used_by_student_phone?: string | null;
  used_at?: string | null;
};

type AdminStats = {
  summary: {
    teachers: number;
    students: number;
    centers: number;
    groups: number;
    templates: number;
    assigned_homeworks: number;
  };
  monthlyHomeworks: { label: string; count: number }[];
  groupsByYear: { year: number; count: number }[];
  subjectHomeworks: { subject_name_ar: string; count: number }[];
  submissionsByStatus: { status: string; count: number }[];
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
const dayNumbers: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function emptyQuestion(): QuestionDraft {
  return {
    type: "mcq",
    text: "",
    points: 1,
    choices: ["", "", "", ""],
    correctChoice: 0,
    correctBoolean: true,
    isOpen: true,
  };
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "مساءً" : "صباحًا";
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function nextSession(slots: ScheduleSlot[]) {
  if (!slots.length) return null;
  const now = new Date();
  return slots
    .map((slot) => {
      const next = new Date(now);
      const [hours, minutes] = slot.time.slice(0, 5).split(":").map(Number);
      let daysUntil = (dayNumbers[slot.day] - now.getDay() + 7) % 7;
      next.setHours(hours, minutes, 0, 0);
      if (daysUntil === 0 && next <= now) daysUntil = 7;
      next.setDate(now.getDate() + daysUntil);
      return next;
    })
    .sort((first, second) => first.getTime() - second.getTime())[0] ?? null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<AdminHomework[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const [activeTab, setActiveTab] = useState<"dashboard" | "teachers" | "groups" | "questions" | "grading">("dashboard");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");

  // Group & Access Code Generator State
  const [selectedCodeGroup, setSelectedCodeGroup] = useState<AdminGroup | null>(null);
  const [batchCount, setBatchCount] = useState<number>(100);
  const [accessCodes, setAccessCodes] = useState<AccessCodeItem[]>([]);
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [codeSearchQuery, setCodeSearchQuery] = useState("");
  const [codesPerPage, setCodesPerPage] = useState<number>(12);
  const [codePage, setCodePage] = useState<number>(1);

  const [title, setTitle] = useState("");
  const [lessonName, setLessonName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [dueMode, setDueMode] = useState<"next_session" | "custom">("next_session");
  const [customDueDate, setCustomDueDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );
  const calculatedDueDate = selectedGroup ? nextSession(selectedGroup.schedule_slots ?? []) : null;
  const maxMonthly = Math.max(1, ...(stats?.monthlyHomeworks.map((item) => item.count) ?? [1]));
  const totalSubmissions = stats?.submissionsByStatus.reduce((total, item) => total + item.count, 0) ?? 0;

  const filteredTeachers = useMemo(() => {
    if (!teacherSearch.trim()) return teachers;
    const query = teacherSearch.trim().toLowerCase();
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.phone.includes(query) ||
        (t.email && t.email.toLowerCase().includes(query)) ||
        t.subjects.some((s) => s.name_ar.includes(query) || s.name_en.toLowerCase().includes(query))
    );
  }, [teachers, teacherSearch]);

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const query = groupSearch.trim().toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(query) ||
        g.teacher_name.toLowerCase().includes(query) ||
        g.center_name.toLowerCase().includes(query) ||
        g.subject_name_ar.includes(query)
    );
  }, [groups, groupSearch]);

  const filteredTemplates = useMemo(() => {
    if (!librarySearch.trim()) return templates;
    const query = librarySearch.trim().toLowerCase();
    return templates.filter(
      (t) => t.title.toLowerCase().includes(query) || t.lesson_name.toLowerCase().includes(query)
    );
  }, [templates, librarySearch]);

  const filteredCodes = useMemo(() => {
    if (!codeSearchQuery.trim()) return accessCodes;
    const query = codeSearchQuery.trim().toUpperCase();
    return accessCodes.filter((item) => item.code.includes(query));
  }, [accessCodes, codeSearchQuery]);

  const totalCodePages = Math.ceil(filteredCodes.length / codesPerPage) || 1;
  const paginatedCodes = useMemo(() => {
    const start = (codePage - 1) * codesPerPage;
    return filteredCodes.slice(start, start + codesPerPage);
  }, [filteredCodes, codePage, codesPerPage]);

  const availableCodesCount = useMemo(
    () => accessCodes.filter((c) => c.is_active && c.used_count < c.max_uses).length,
    [accessCodes]
  );

  function handleTabChange(tab: "dashboard" | "teachers" | "groups" | "questions" | "grading") {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("admin_active_tab", tab);
    }
  }

  function handleSelectGroup(group: AdminGroup) {
    setSelectedCodeGroup(group);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("admin_selected_group_id", group.id);
    }
    void loadGroupCodes(group.id);
  }

  async function loadData() {
    const session = getStoredSession();
    if (!session || session.user.role !== "super_admin") {
      router.replace("/login");
      return;
    }
    try {
      const [templatesResponse, groupsResponse, statsResponse, teachersResponse] = await Promise.all([
        axiosInstance.get<AdminHomework[]>("/admin/content/homeworks"),
        axiosInstance.get<AdminGroup[]>("/admin/groups"),
        axiosInstance.get<AdminStats>("/admin/dashboard/stats"),
        axiosInstance.get<AdminTeacher[]>("/admin/teachers"),
      ]);
      setTemplates(templatesResponse.data);
      setGroups(groupsResponse.data);
      setStats(statsResponse.data);
      setTeachers(teachersResponse.data);

      if (typeof window !== "undefined") {
        const savedTab = window.localStorage.getItem("admin_active_tab");
        const normalizedTab = savedTab === "content" ? "questions" : savedTab;
        if (normalizedTab && ["dashboard", "teachers", "groups", "questions", "grading"].includes(normalizedTab)) {
          setActiveTab(normalizedTab as "dashboard" | "teachers" | "groups" | "questions" | "grading");
        }
      }

      if (groupsResponse.data.length > 0) {
        const savedGroupId = typeof window !== "undefined" ? window.localStorage.getItem("admin_selected_group_id") : null;
        const matchedGroup = groupsResponse.data.find((g) => g.id === savedGroupId);
        const targetGroup = matchedGroup ?? groupsResponse.data[0];
        setSelectedCodeGroup(targetGroup);
        void loadGroupCodes(targetGroup.id);
      }
    } catch (loadError) {
      const message = getApiError(loadError);
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  async function loadGroupCodes(groupId: string) {
    setLoadingCodes(true);
    try {
      const res = await axiosInstance.get<AccessCodeItem[]>(`/admin/groups/${groupId}/access-codes`);
      setAccessCodes(res.data);
      setCodePage(1);
    } catch (err) {
      showToast({ type: "error", message: getApiError(err) });
    } finally {
      setLoadingCodes(false);
    }
  }

  async function handleGenerateBatchCodes() {
    if (!selectedCodeGroup) return;
    setGeneratingCodes(true);
    try {
      const count = Math.max(1, Number(batchCount) || 100);
      const res = await axiosInstance.post<AccessCodeItem[]>(
        `/admin/groups/${selectedCodeGroup.id}/access-codes`,
        { count }
      );
      showToast({ type: "success", message: `تم إنشـاء ${res.data.length} كود جديد بنجاح!` });
      await loadGroupCodes(selectedCodeGroup.id);
    } catch (err) {
      showToast({ type: "error", message: getApiError(err) });
    } finally {
      setGeneratingCodes(false);
    }
  }

  async function handleCopyAllAvailableCodes() {
    const activeList = accessCodes
      .filter((c) => c.is_active && c.used_count < c.max_uses)
      .map((c) => c.code);
    if (activeList.length === 0) {
      showToast({ type: "info", message: "لا توجد أكواد متاحة للنسخ." });
      return;
    }
    const textToCopy = activeList.join("\n");
    await navigator.clipboard.writeText(textToCopy);
    showToast({ type: "success", message: `تم نسخ ${activeList.length} كود متاح إلى الحافظة!` });
  }

  async function handleCopyCode(code: string) {
    await navigator.clipboard.writeText(code);
    showToast({ type: "info", message: `تم نسخ الكود: ${code}` });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, ...patch } : question));
  }

  function updateChoice(questionIndex: number, choiceIndex: number, text: string) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) return question;
        const choices = [...question.choices];
        choices[choiceIndex] = text;
        return { ...question, choices };
      }),
    );
  }

  function updateQuestionType(index: number, type: QuestionType) {
    updateQuestion(index, {
      type,
      choices: type === "mcq" ? ["", "", "", ""] : [],
      correctChoice: 0,
    });
  }

  function addQuestion() {
    setQuestions((current) => [...current.map((question) => ({ ...question, isOpen: false })), emptyQuestion()]);
  }

  function toPayload(question: QuestionDraft) {
    return {
      type: question.type,
      text: question.text.trim(),
      points: question.points,
      ...(question.type === "mcq"
        ? { choices: question.choices.map((text, index) => ({ text: text.trim(), isCorrect: index === question.correctChoice, orderIndex: index })) }
        : question.type === "true_false" ? { correctBoolean: question.correctBoolean } : {}),
    };
  }

  async function createHomework() {
    setError("");
    if (!lessonName.trim() || !title.trim()) {
      const message = "اكتب اسم الدرس وعنوان الواجب أولاً.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }
    const invalidQuestion = questions.find((question) => !question.text.trim());
    if (invalidQuestion) {
      const message = "تأكد من كتابة نص كل الأسئلة.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }
    setCreating(true);
    try {
      const payload = {
        lessonName: lessonName.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        questions: questions.map(toPayload),
      };

      if (editingTemplateId) {
        await axiosInstance.put(`/admin/content/homeworks/${editingTemplateId}`, payload);
        showToast({ type: "success", message: "تم تحديث الواجب والأسئلة بنجاح في مكتبة الواجبات!" });
        setEditingTemplateId(null);
      } else {
        await axiosInstance.post("/admin/content/homeworks", payload);
        showToast({ type: "success", message: "تم نشر الواجب بنجاح وإضافته للمكتبة!" });
      }

      setLessonName("");
      setTitle("");
      setDescription("");
      setQuestions([emptyQuestion()]);
      await loadData();
    } catch (createError) {
      const message = getApiError(createError);
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setCreating(false);
    }
  }

  async function handleEditTemplate(templateId: string) {
    setLoadingTemplate(true);
    try {
      const res = await axiosInstance.get<{
        id: string;
        title: string;
        description: string | null;
        lesson_name: string;
        questions: {
          id: string;
          type: "mcq" | "true_false" | "essay";
          text: string;
          points: number;
          correct_boolean: boolean | null;
          choices: { text: string; is_correct: boolean }[];
        }[];
      }>(`/admin/content/homeworks/${templateId}`);

      const data = res.data;
      setActiveTab("questions");
      setEditingTemplateId(data.id);
      setLessonName(data.lesson_name);
      setTitle(data.title);
      setDescription(data.description ?? "");
      setQuestions(
        data.questions.map((q) => {
          const correctIndex = q.choices ? q.choices.findIndex((c) => c.is_correct) : 0;
          return {
            type: q.type,
            text: q.text,
            points: q.points,
            choices: q.choices && q.choices.length > 0 ? q.choices.map((c) => c.text) : ["", "", "", ""],
            correctChoice: correctIndex >= 0 ? correctIndex : 0,
            correctBoolean: q.correct_boolean !== false,
            isOpen: true,
          };
        })
      );

      showToast({ type: "success", message: `تم تحميل بيانات الواجب "${data.title}" للتعديل.` });
      window.scrollTo({ top: 120, behavior: "smooth" });
    } catch (err) {
      showToast({ type: "error", message: getApiError(err) });
    } finally {
      setLoadingTemplate(false);
    }
  }

  function handleCancelEdit() {
    setEditingTemplateId(null);
    setLessonName("");
    setTitle("");
    setDescription("");
    setQuestions([emptyQuestion()]);
    showToast({ type: "info", message: "تم إلغاء التعديل والعودة لوضع إنشاء واجب جديد." });
  }

  async function importHomeworkFromExcel() {
    if (!excelFile) return;
    if (!lessonName.trim() || !title.trim()) {
      const message = "اكتب اسم الدرس وعنوان الواجب قبل استيراد أسئلة Excel.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }

    setImporting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", excelFile);
      formData.append("lessonName", lessonName.trim());
      formData.append("title", title.trim());
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      const { data } = await axiosInstance.post<{
        importedQuestions: number;
        questions: ImportedQuestion[];
      }>("/admin/content/homeworks/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const converted: QuestionDraft[] = data.questions.map((item) => {
        const isMcq = item.type === "mcq";
        const choices = isMcq
          ? (item.choices?.map((c) => c.text.trim()) ?? ["", "", "", ""])
          : [];
        while (choices.length < 4 && isMcq) {
          choices.push("");
        }

        const correctChoiceIndex = isMcq
          ? Math.max(0, item.choices?.findIndex((c) => c.isCorrect) ?? 0)
          : 0;

        return {
          type: item.type,
          text: item.text,
          points: Number(item.points) || 1,
          choices,
          correctChoice: correctChoiceIndex,
          correctBoolean: item.correctBoolean !== false,
          isOpen: true,
        };
      });

      setQuestions(converted);
      showToast({ type: "success", message: `تم استيراد ${data.importedQuestions} سؤال من ملف Excel! راجع وعدّل قبل النشر.` });
    } catch (importError) {
      const message = getApiError(importError);
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setImporting(false);
    }
  }

  async function assignHomework() {
    setError("");
    if (!selectedTemplateId || !selectedGroupId) {
      const message = "اختار الواجب والمجموعة أولاً.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }
    const finalDueDate = dueMode === "next_session" ? calculatedDueDate?.toISOString() : customDueDate ? new Date(customDueDate).toISOString() : null;
    if (!finalDueDate) {
      const message = "حدد تاريخ ووقت تسليم الواجب.";
      setError(message);
      showToast({ type: "error", message });
      return;
    }
    setAssigning(true);
    try {
      await axiosInstance.post("/admin/content/assignments", {
        templateId: selectedTemplateId,
        groupId: selectedGroupId,
        dueDate: finalDueDate,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        isPublished: true,
      });
      showToast({ type: "success", message: "تم ربط الواجب بالمجموعة بنجاح!" });
      setSelectedTemplateId("");
      setSelectedGroupId("");
      setCustomDueDate("");
      await loadData();
    } catch (assignError) {
      const message = getApiError(assignError);
      setError(message);
      showToast({ type: "error", message });
    } finally {
      setAssigning(false);
    }
  }

  const inputClass = "w-full rounded-[14px] border-2 border-[#DCE4EF] bg-white px-4 py-3 text-[14px] font-bold text-[#173F5F] outline-none transition focus:border-[#20639B]";

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#1F2937]">
      {/* Main Top Header Navbar */}
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

      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1400px] py-10 lg:w-[calc(100%-6rem)]">
        {loading ? (
          <div className="rounded-[24px] border-2 border-[#173F5F] bg-white p-16 text-center text-[#6B7280]">
            <p className="text-[18px] font-bold">جاري تحميل بيانات الأدمن بالكامل...</p>
          </div>
        ) : error ? (
          <div className="rounded-[24px] border-2 border-[#B42318]/25 bg-[#FEF3F2] p-8 text-center text-[#B42318]">
            <p className="text-[16px] font-bold">{error}</p>
          </div>
        ) : stats ? (
          <>
            {/* Unified Page Header Row */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-6 pb-6 border-b-2 border-[#DCE4EF]">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#EFF6FF] border-2 border-[#20639B]/30 text-[#20639B]">
                  {activeTab === "dashboard" ? (
                    <LayoutDashboard className="w-8 h-8" />
                  ) : activeTab === "teachers" ? (
                    <Users className="w-8 h-8" />
                  ) : activeTab === "groups" ? (
                    <Layers className="w-8 h-8" />
                  ) : activeTab === "questions" ? (
                    <PenTool className="w-8 h-8" />
                  ) : (
                    <Award className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h1 className="text-[32px] font-black text-[#173F5F]">
                    {activeTab === "dashboard" && "لوحة التحكم الرئيسية"}
                    {activeTab === "teachers" && "دليل المدرسين"}
                    {activeTab === "groups" && "دليل المجموعات وتوليد الأكواد"}
                    {activeTab === "questions" && "إضافة الأسئلة"}
                    {activeTab === "grading" && "تصحيح الواجب"}
                  </h1>
                  <p className="mt-1 text-[13px] text-[#6B7280]">
                    {activeTab === "dashboard" && "نظرة عامة على نشاط المنصة، المدرسين، الطلاب، وإحصائيات التسليمات."}
                    {activeTab === "teachers" && "اعرض جميع المدرسين المسجلين وتفاصيل مجموعاتهم وسناترهم بالتفصيل."}
                    {activeTab === "groups" && "اختر أي مجموعة تابعة لأي مدرس لبث وتوليد الأكواد فورياً، وإدارة الطلاب."}
                    {activeTab === "questions" && "أنشئ الواجبات وأضف أسئلتها يدويًا أو من خلال ملف Excel."}
                    {activeTab === "grading" && "اختار الواجب مباشرةً لعرض إجابات الطلاب وتصحيحها ورصد الدرجات."}
                  </p>
                </div>
              </div>

              {/* Tab Switcher Buttons */}
              <div className="flex flex-wrap items-center gap-2 rounded-[20px] border-2 border-[#173F5F] bg-white p-2 shadow-[4px_4px_0_#DCE4EF]">
                <button
                  onClick={() => handleTabChange("dashboard")}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-black transition cursor-pointer ${
                    activeTab === "dashboard"
                      ? "bg-[#173F5F] text-white shadow-[2px_2px_0_#F6C445]"
                      : "text-[#173F5F] hover:bg-[#F7F9FC]"
                  }`}
                  type="button"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>الرئيسية والاحصائيات</span>
                </button>

                <button
                  onClick={() => handleTabChange("teachers")}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-black transition cursor-pointer ${
                    activeTab === "teachers"
                      ? "bg-[#173F5F] text-white shadow-[2px_2px_0_#F6C445]"
                      : "text-[#173F5F] hover:bg-[#F7F9FC]"
                  }`}
                  type="button"
                >
                  <Users className="w-4 h-4" />
                  <span>دليل المدرسين ({teachers.length})</span>
                </button>

                <button
                  onClick={() => handleTabChange("groups")}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-black transition cursor-pointer ${
                    activeTab === "groups"
                      ? "bg-[#173F5F] text-white shadow-[2px_2px_0_#F6C445]"
                      : "text-[#173F5F] hover:bg-[#F7F9FC]"
                  }`}
                  type="button"
                >
                  <Layers className="w-4 h-4" />
                  <span>المجموعات والأكواد ({groups.length})</span>
                </button>

                <button
                  onClick={() => handleTabChange("questions")}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-black transition cursor-pointer ${
                    activeTab === "questions"
                      ? "bg-[#173F5F] text-white shadow-[2px_2px_0_#F6C445]"
                      : "text-[#173F5F] hover:bg-[#F7F9FC]"
                  }`}
                  type="button"
                >
                  <PenTool className="w-4 h-4" />
                  <span>إضافة الأسئلة</span>
                </button>

                <button
                  onClick={() => handleTabChange("grading")}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-black transition cursor-pointer ${
                    activeTab === "grading"
                      ? "bg-[#173F5F] text-white shadow-[2px_2px_0_#F6C445]"
                      : "text-[#173F5F] hover:bg-[#F7F9FC]"
                  }`}
                  type="button"
                >
                  <Award className="w-4 h-4" />
                  <span>تصحيح الواجب</span>
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* TAB 1: DASHBOARD & STATS                                      */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "dashboard" && (
              <div className="grid gap-8">
                {/* Summary Cards Grid */}
                <div className="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
                  <button
                    onClick={() => setActiveTab("teachers")}
                    className="rounded-[24px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#173F5F] text-right transition hover:bg-[#EFF6FF] cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-black text-[#20639B]">المدرسين المسجلين</span>
                      <Users className="w-5 h-5 text-[#20639B]" />
                    </div>
                    <strong className="mt-3 block text-[42px] font-black text-[#173F5F]">{stats.summary.teachers}</strong>
                    <span className="text-[12px] font-bold text-[#6B7280]">اضغط لعرض دليل المدرسين ←</span>
                  </button>

                  <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#FFF9E8] p-6 shadow-[5px_5px_0_#F6C445] text-right">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-black text-[#8A6500]">الطلاب المسجلين</span>
                      <GraduationCap className="w-5 h-5 text-[#8A6500]" />
                    </div>
                    <strong className="mt-3 block text-[42px] font-black text-[#173F5F]">{stats.summary.students}</strong>
                    <span className="text-[12px] font-bold text-[#8A6500]">إجمالي طلاب المنصة</span>
                  </div>

                  <button
                    onClick={() => setActiveTab("groups")}
                    className="rounded-[24px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#DCE4EF] text-right transition hover:bg-[#F7F9FC] cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-black text-[#6B7280]">المجموعات والمراكز</span>
                      <Layers className="w-5 h-5 text-[#173F5F]" />
                    </div>
                    <strong className="mt-3 block text-[42px] font-black text-[#173F5F]">{stats.summary.groups}</strong>
                    <span className="text-[12px] font-bold text-[#6B7280]">في {stats.summary.centers} مراكز تعليمية ←</span>
                  </button>

                  <div className="rounded-[24px] border-2 border-[#173F5F] bg-[#EAF7E5] p-6 shadow-[5px_5px_0_#68AB48] text-right">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-black text-[#27743A]">الواجبات والقوالب</span>
                      <BookOpen className="w-5 h-5 text-[#27743A]" />
                    </div>
                    <strong className="mt-3 block text-[42px] font-black text-[#27743A]">{stats.summary.assigned_homeworks}</strong>
                    <span className="text-[12px] font-bold text-[#27743A]">من إجمالي {stats.summary.templates} قالب واجب</span>
                  </div>
                </div>

                {/* Submissions Stats & Activity Charts */}
                <div className="grid grid-cols-[1.35fr_.65fr] gap-6 max-lg:grid-cols-1">
                  <article className="rounded-[28px] border-2 border-[#173F5F] bg-white p-6 shadow-[6px_6px_0_#DCE4EF]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-[22px] font-black text-[#173F5F]">نشاط الواجبات الشهرية</h2>
                        <p className="mt-1 text-[13px] text-[#6B7280]">الواجبات المعينة خلال آخر 6 أشهر</p>
                      </div>
                      <span className="rounded-full bg-[#EFF6FF] px-3 py-1.5 text-[12px] font-black text-[#20639B]">{stats.summary.templates} قالب جاهز</span>
                    </div>

                    <div className="mt-8 flex h-[200px] items-end justify-between gap-3 border-b-2 border-[#DCE4EF] px-2 pt-4">
                      {stats.monthlyHomeworks.map((item) => (
                        <div className="flex h-full flex-1 flex-col items-center justify-end gap-2" key={item.label}>
                          <span className="text-[11px] font-black text-[#173F5F]">{item.count}</span>
                          <div className="w-full max-w-[48px] rounded-t-[12px] bg-[#20639B] transition-all" style={{ height: `${item.count ? Math.max(12, (item.count / maxMonthly) * 100) : 5}%` }} />
                          <span className="text-[11px] font-bold text-[#6B7280]">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-[28px] border-2 border-[#173F5F] bg-[#173F5F] p-6 text-white shadow-[6px_6px_0_#F6C445]">
                    <div className="flex items-start justify-between gap-3 border-b border-[#B5C9DD]/30 pb-4">
                      <div>
                        <h2 className="text-[22px] font-black">حالة التسليمات والإجابات</h2>
                        <p className="mt-1 text-[12px] text-[#B5C9DD]">إجمالي الإجابات المسلمة</p>
                      </div>
                      <span className="rounded-full bg-[#F6C445] px-3.5 py-1 text-[12px] font-black text-[#173F5F]">{totalSubmissions}</span>
                    </div>

                    <div className="mt-6 grid gap-3">
                      {stats.submissionsByStatus.map((item) => {
                        const isGraded = item.status === "graded";
                        const isSubmitted = item.status === "submitted";
                        return (
                          <div key={item.status} className="rounded-[18px] border border-[#B5C9DD]/30 bg-white/10 p-4 flex items-center justify-between gap-3">
                            <span className="font-bold text-[14px] flex items-center gap-2">
                              {isGraded ? (
                                <CheckCircle2 className="w-4 h-4 text-[#68AB48]" />
                              ) : isSubmitted ? (
                                <Clock className="w-4 h-4 text-[#F6C445]" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-[#B5C9DD]" />
                              )}
                              <span>{isGraded ? "تم التصحيح" : isSubmitted ? "في انتظار التصحيح" : "قيد الحل"}</span>
                            </span>
                            <strong className="text-[20px] font-black text-[#F6C445]">{item.count}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 2: TEACHERS DIRECTORY (EXACT AS ORIGINAL)                  */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "teachers" && (
              <div className="grid gap-8">
                <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
                  <span className="text-[14px] font-black text-[#173F5F]">عدد المدرسين المسجلين: ({filteredTeachers.length})</span>
                  <div className="relative w-[320px] max-md:w-full">
                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#6B7280]" />
                    <input
                      type="text"
                      placeholder="ابحث باسم المدرس، رقم الهاتف، أو المادة..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      className="w-full rounded-[14px] border-2 border-[#DCE4EF] bg-white pl-9 pr-4 py-2.5 text-[13px] font-bold text-[#173F5F] outline-none focus:border-[#20639B]"
                    />
                  </div>
                </div>

                {filteredTeachers.length === 0 ? (
                  <div className="rounded-[24px] border-2 border-dashed border-[#DCE4EF] bg-white p-12 text-center text-[#6B7280]">
                    <p className="text-[16px] font-bold">لا يوجد مدرسين يطابقون بحثك.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
                    {filteredTeachers.map((teacher) => (
                      <article
                        key={teacher.id}
                        className="rounded-[28px] border-2 border-[#173F5F] bg-white p-6 shadow-[6px_6px_0_#173F5F] flex flex-col justify-between gap-6 transition hover:border-[#20639B]"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 border-b-2 border-[#DCE4EF] pb-4">
                            <div>
                              <span className="inline-block rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-black text-[#20639B] border border-[#20639B]/30">
                                {teacher.governorate}
                              </span>
                              <h3 className="mt-2 text-[22px] font-black text-[#173F5F]">
                                {teacher.name}
                              </h3>
                            </div>
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F6C445] border-2 border-[#173F5F] font-black text-[#173F5F] text-[18px]">
                              {teacher.name.slice(0, 1)}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-2.5 text-[13px] font-bold text-[#6B7280]">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-[#173F5F]" />
                              <span>الهاتف: <strong className="text-[#173F5F]">{teacher.phone}</strong></span>
                            </div>
                            {teacher.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-[#173F5F]" />
                                <span className="truncate">البريد: <strong className="text-[#173F5F]">{teacher.email}</strong></span>
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-[#173F5F]">المواد:</span>
                              {teacher.subjects.map((sub, i) => (
                                <span key={i} className="rounded-full bg-[#FFF9E8] px-2.5 py-0.5 text-[11px] font-black text-[#8A6500] border border-[#F6C445]/60">
                                  {sub.name_ar}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Teacher Summary Badges */}
                          <div className="mt-6 grid grid-cols-3 gap-2 text-center border-t-2 border-[#DCE4EF] pt-4">
                            <div className="rounded-[14px] bg-[#F7F9FC] p-2.5 border border-[#DCE4EF]">
                              <span className="block text-[10px] font-black text-[#6B7280]">السنتر</span>
                              <strong className="text-[18px] font-black text-[#173F5F]">{teacher.centers_count}</strong>
                            </div>
                            <div className="rounded-[14px] bg-[#EFF6FF] p-2.5 border border-[#20639B]/30">
                              <span className="block text-[10px] font-black text-[#20639B]">المجموعات</span>
                              <strong className="text-[18px] font-black text-[#20639B]">{teacher.groups_count}</strong>
                            </div>
                            <div className="rounded-[14px] bg-[#FFF9E8] p-2.5 border border-[#F6C445]/60">
                              <span className="block text-[10px] font-black text-[#8A6500]">الطلاب</span>
                              <strong className="text-[18px] font-black text-[#8A6500]">{teacher.students_count}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Standalone Route Navigation Link */}
                        <Link
                          href={`/admin/teachers/${teacher.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-5 py-3 text-[14px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F] hover:bg-[#F3B926] transition text-center"
                        >
                          <Eye className="w-4 h-4 text-[#173F5F]" />
                          <span>عرض تفاصيل المدرس والمجموعات</span>
                          <ArrowLeft className="w-4 h-4" />
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 3: GROUPS & BATCH ACCESS CODE GENERATOR                    */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "groups" && (
              <div className="grid gap-10">
                {/* Group Selector Cards Grid */}
                <section className="rounded-[28px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#173F5F]">
                  <div className="flex items-center justify-between gap-4 border-b-2 border-[#DCE4EF] pb-4 max-md:flex-col max-md:items-start">
                    <div>
                      <h2 className="text-[24px] font-black text-[#173F5F]">اختيار المجموعة لإدارة الأكواد والطلاب</h2>
                      <p className="mt-1 text-[13px] text-[#6B7280]">اضغط على أي مجموعة لاختيارها وبث وتوليد الأكواد المطلوبة فوراً.</p>
                    </div>

                    <div className="relative w-[300px] max-md:w-full">
                      <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#6B7280]" />
                      <input
                        type="text"
                        placeholder="ابحث باسم المجموعة، المدرس، أو السنتر..."
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                        className="w-full rounded-[14px] border-2 border-[#DCE4EF] bg-[#F7F9FC] pl-9 pr-4 py-2.5 text-[13px] font-bold text-[#173F5F] outline-none focus:border-[#20639B]"
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
                    {filteredGroups.map((group) => {
                      const isSelected = selectedCodeGroup?.id === group.id;
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => handleSelectGroup(group)}
                          className={`rounded-[20px] border-2 p-4 text-right transition cursor-pointer flex flex-col justify-between gap-3 ${
                            isSelected
                              ? "border-[#20639B] bg-[#EFF6FF] shadow-[4px_4px_0_#20639B]"
                              : "border-[#DCE4EF] bg-white hover:border-[#20639B]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="rounded-full bg-[#FFF9E8] px-2.5 py-0.5 text-[10px] font-black text-[#8A6500] border border-[#F6C445]/60">
                                {group.center_name}
                              </span>
                              <span className="text-[11px] font-bold text-[#68AB48]">
                                {group.students_count} طالب
                              </span>
                            </div>
                            <h3 className="text-[17px] font-black text-[#173F5F]">{group.name}</h3>
                            <p className="mt-1 text-[12px] font-bold text-[#20639B]">
                              المدرس: {group.teacher_name} · {group.subject_name_ar}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-[#DCE4EF] pt-2 text-[11px] font-bold text-[#6B7280]">
                            <span>انقر لتوليد الأكواد</span>
                            {isSelected && <span className="font-black text-[#20639B]">✓ محددة الآن</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Batch Access Code Generator Section */}
                {selectedCodeGroup && (
                  <section className="rounded-[28px] border-2 border-[#173F5F] bg-[#173F5F] p-8 text-white shadow-[6px_6px_0_#F6C445]">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#B5C9DD]/30 pb-5">
                      <div>
                        <span className="rounded-full bg-[#F6C445] px-3.5 py-1 text-[11px] font-black text-[#173F5F] mb-2 inline-block">
                          مسؤولية الأدمن الحصرية
                        </span>
                        <h2 className="text-[28px] font-black">
                          إنشاء وتوليد الأكواد (Batch Access Code Generator)
                        </h2>
                        <p className="mt-1 text-[13px] text-[#B5C9DD]">
                          المجموعة المحددة: <strong className="text-[#F6C445]">{selectedCodeGroup.name}</strong> ({selectedCodeGroup.teacher_name} · {selectedCodeGroup.center_name})
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => void handleCopyAllAvailableCodes()}
                          className="inline-flex items-center gap-2 rounded-full border-2 border-[#F6C445] bg-[#FFF9E8] px-4 py-2.5 text-[12px] font-black text-[#8A6500] hover:bg-[#F6C445] hover:text-[#173F5F] transition cursor-pointer"
                        >
                          <Copy className="w-4 h-4 text-[#8A6500]" />
                          <span>نسخ جميع الأكواد المتاحة ({availableCodesCount})</span>
                        </button>

                        <Link
                          href={`/admin/groups/${selectedCodeGroup.id}/students`}
                          className="inline-flex items-center gap-2 rounded-full border-2 border-[#B5C9DD] bg-transparent px-4 py-2.5 text-[12px] font-black text-white hover:bg-white hover:text-[#173F5F] transition"
                        >
                          <Users className="w-4 h-4" />
                          <span>عرض طلاب المجموعة</span>
                        </Link>
                      </div>
                    </div>

                    {/* Generator Controls */}
                    <div className="mt-8 grid grid-cols-[1fr_auto] items-end gap-6 max-lg:grid-cols-1">
                      <div>
                        <label className="block text-[13px] font-black text-[#DCEBFA] mb-2">
                          عدد الأكواد المطلوبة إنشاءها:
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={batchCount}
                            onChange={(e) => setBatchCount(Number(e.target.value))}
                            className="w-[140px] rounded-[14px] border-2 border-[#B5C9DD]/40 bg-white px-4 py-3 text-[18px] font-black text-[#173F5F] text-center outline-none"
                          />
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[10, 25, 50, 100, 200].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setBatchCount(num)}
                                className={`rounded-full border px-3.5 py-1.5 text-[12px] font-black transition cursor-pointer ${
                                  batchCount === num
                                    ? "bg-[#F6C445] text-[#173F5F] border-[#F6C445]"
                                    : "bg-white/10 text-[#DCEBFA] border-[#B5C9DD]/30 hover:bg-white/20"
                                }`}
                              >
                                {num}+
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={generatingCodes}
                        onClick={() => void handleGenerateBatchCodes()}
                        className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-6 py-3.5 text-[15px] font-black text-[#173F5F] shadow-[3px_3px_0_#0D2F49] hover:bg-[#F3B926] transition disabled:opacity-60 cursor-pointer min-w-[200px]"
                      >
                        <Zap className="w-5 h-5 text-[#173F5F]" />
                        <span>{generatingCodes ? "جاري التوليد..." : `توليد ${batchCount} كود الآن`}</span>
                      </button>
                    </div>

                    {/* Codes List & Pagination Table */}
                    <div className="mt-10 border-t border-[#B5C9DD]/30 pt-6">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <h3 className="text-[20px] font-black text-white">
                            قائمة الأكواد المنشأة ({filteredCodes.length}):
                          </h3>
                          <select
                            value={codesPerPage}
                            onChange={(e) => {
                              setCodesPerPage(Number(e.target.value));
                              setCodePage(1);
                            }}
                            className="rounded-full border border-[#B5C9DD]/40 bg-[#0F3552] px-3 py-1 text-[11px] font-bold text-white outline-none"
                          >
                            <option value={12}>12 / صفحة</option>
                            <option value={24}>24 / صفحة</option>
                            <option value={48}>48 / صفحة</option>
                            <option value={96}>96 / صفحة</option>
                          </select>
                        </div>

                        <div className="relative w-[260px]">
                          <Search className="w-4 h-4 absolute left-3 top-3 text-[#B5C9DD]" />
                          <input
                            type="text"
                            placeholder="ابحث بالكود..."
                            value={codeSearchQuery}
                            onChange={(e) => {
                              setCodeSearchQuery(e.target.value);
                              setCodePage(1);
                            }}
                            className="w-full rounded-[14px] border border-[#B5C9DD]/30 bg-white/10 pl-9 pr-4 py-2 text-[12px] font-bold text-white outline-none placeholder:text-[#B5C9DD]/60"
                          />
                        </div>
                      </div>

                      {loadingCodes ? (
                        <p className="p-10 text-center text-[#B5C9DD]">جاري تحميل الأكواد...</p>
                      ) : paginatedCodes.length === 0 ? (
                        <p className="rounded-[18px] border border-[#B5C9DD]/30 p-8 text-center text-[13px] text-[#B5C9DD]">
                          لا توجد أكواد مضافة بعد. اختر العدد ثم اضغط على "توليد كود الآن".
                        </p>
                      ) : (
                        <>
                          <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
                            {paginatedCodes.map((item) => {
                              const isUsed = item.used_count >= item.max_uses || !item.is_active;
                              return (
                                <div
                                  key={item.id}
                                  className={`rounded-[16px] border p-3.5 flex flex-col justify-between gap-2 transition ${
                                    isUsed
                                      ? "border-[#B42318]/40 bg-[#FEF2F2]/10 text-[#FCA5A5]"
                                      : "border-[#68AB48]/40 bg-[#DCFCE7]/10 text-white"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <strong className="block text-[16px] font-black tracking-wider text-[#F6C445]">
                                        {item.code}
                                      </strong>
                                      <span className={`text-[10px] font-bold ${isUsed ? "text-[#FCA5A5]" : "text-[#B5C9DD]"}`}>
                                        {isUsed ? "مستخدم" : "متاح لطالب واحد"}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => void handleCopyCode(item.code)}
                                      className="rounded-full bg-white/20 p-2 text-white hover:bg-white hover:text-[#173F5F] transition cursor-pointer"
                                      title="نسخ الكود"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {isUsed && item.used_by_student_name && (
                                    <div className="mt-1 border-t border-white/10 pt-1.5 text-[10px] text-[#DCEBFA]">
                                      <span>الطالب: <strong className="text-[#F6C445]">{item.used_by_student_name}</strong></span>
                                      {item.used_by_student_phone && (
                                        <span className="block text-[9px] text-[#B5C9DD]">تليفون: {item.used_by_student_phone}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Pagination Bar */}
                          {totalCodePages > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-2 border-t border-[#B5C9DD]/20 pt-4">
                              <button
                                type="button"
                                disabled={codePage === 1}
                                onClick={() => setCodePage((p) => Math.max(1, p - 1))}
                                className="rounded-full bg-white/10 px-3.5 py-1.5 text-[12px] font-bold text-white hover:bg-white/20 disabled:opacity-40"
                              >
                                السابقة
                              </button>
                              <span className="text-[12px] font-bold text-[#B5C9DD]">
                                صفحة {codePage} من {totalCodePages}
                              </span>
                              <button
                                type="button"
                                disabled={codePage === totalCodePages}
                                onClick={() => setCodePage((p) => Math.min(totalCodePages, p + 1))}
                                className="rounded-full bg-white/10 px-3.5 py-1.5 text-[12px] font-bold text-white hover:bg-white/20 disabled:opacity-40"
                              >
                                التالية
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 4/5: QUESTION MANAGEMENT AND HOMEWORK GRADING               */}
            {/* ------------------------------------------------------------- */}
            {(activeTab === "questions" || activeTab === "grading") && (
              <div className="grid gap-10">
                {/* Creation & Assignment Forms Grid */}
                <div className="grid grid-cols-[1.1fr_.9fr] items-start gap-6 max-lg:grid-cols-1">
                  {/* Left Column: Create or Edit Homework Form */}
                  {activeTab === "questions" && <section className="rounded-[28px] border-2 border-[#173F5F] bg-white p-6 shadow-[5px_5px_0_#173F5F]">
                    <div className="flex items-center justify-between gap-4 border-b-2 border-[#DCE4EF] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-[#EFF6FF] border border-[#20639B]/30 text-[#20639B]">
                          {editingTemplateId ? <PenTool className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                        </div>
                        <div>
                          <h2 className="text-[26px] font-black text-[#173F5F]">
                            {editingTemplateId ? "تعديل الواجب والأسئلة" : "إنشاء واجب وأسئلته"}
                          </h2>
                          <p className="mt-1 text-[13px] text-[#6B7280]">
                            {editingTemplateId
                              ? "أنت تقوم الآن بتعديل الواجب المختار. احفظ التعديلات لتأكيد التغييرات."
                              : "اكتب العنوان والدرس، ضيف الأسئلة يدويًا أو حمّلها من Excel."}
                          </p>
                        </div>
                      </div>

                      {editingTemplateId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#173F5F] bg-[#FEF2F2] px-3.5 py-1.5 text-[12px] font-black text-[#B42318] hover:bg-[#B42318] hover:text-white transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>إلغاء التعديل</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-6 grid gap-5">
                      {/* Excel Import Box */}
                      <div className="rounded-[20px] border-2 border-[#20639B] bg-[#EFF6FF] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-[15px] font-black text-[#173F5F]">استيراد الأسئلة من Excel</h3>
                            <p className="mt-1 text-[12px] leading-[1.8] text-[#6B7280]">املأ البيانات العامة، اختار الملف، والأسئلة هتتحول تلقائيًا لنفس أنواع النظام.</p>
                          </div>
                          <a className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#173F5F] bg-white px-3 py-2 text-[11px] font-black text-[#173F5F]" download href="/templates/homework_questions_template.xlsx">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-[#20639B]" />
                            <span>تحميل الـ Template</span>
                          </a>
                        </div>
                        <input accept=".xlsx,.xls" className="mt-4 block w-full rounded-[14px] border-2 border-[#DCE4EF] bg-white px-4 py-3 text-[12px] font-bold text-[#173F5F]" onChange={(event) => setExcelFile(event.target.files?.[0] ?? null)} type="file" />
                        {excelFile && <p className="mt-2 text-[12px] font-bold text-[#20639B]">الملف المختار: {excelFile.name}</p>}
                        <button className="mt-4 rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-4 py-2 text-[12px] font-black text-[#173F5F] shadow-[2px_2px_0_#173F5F] disabled:cursor-not-allowed disabled:opacity-50" disabled={importing || !excelFile} onClick={() => void importHomeworkFromExcel()} type="button">{importing ? "جاري تحميل الأسئلة..." : "تحميل الأسئلة داخل النموذج"}</button>
                      </div>

                      <label className="text-[13px] font-black text-[#173F5F]">اسم الدرس<input className={inputClass} onChange={(event) => setLessonName(event.target.value)} placeholder="الدرس الأول" required value={lessonName} /></label>
                      <label className="text-[13px] font-black text-[#173F5F]">عنوان الواجب<input className={inputClass} onChange={(event) => setTitle(event.target.value)} placeholder="مراجعة الدرس الأول" required value={title} /></label>
                      <label className="text-[13px] font-black text-[#173F5F]">وصف مختصر<textarea className={`${inputClass} min-h-[80px] resize-y`} onChange={(event) => setDescription(event.target.value)} placeholder="التعليمات المطلوبة من الطلاب" value={description} /></label>

                      {/* Question Draft List */}
                      <div className="grid gap-3">
                        {questions.map((question, index) => (
                          <article className="overflow-hidden rounded-[18px] border-2 border-[#DCE4EF] bg-[#F7F9FC]" key={index}>
                            <div className="flex items-center justify-between gap-3 px-4 py-3">
                              <span className="flex items-center gap-2 text-[14px] font-black text-[#173F5F]"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F6C445] text-[13px] font-black text-[#173F5F]">{index + 1}</span>السؤال {index + 1}</span>
                              <div className="flex items-center gap-2">
                                <select aria-label={`نوع السؤال ${index + 1}`} className="rounded-full border-2 border-[#20639B] bg-white px-3 py-2 text-[11px] font-black text-[#173F5F] outline-none cursor-pointer" onChange={(event) => updateQuestionType(index, event.target.value as QuestionType)} value={question.type}>
                                  <option value="mcq">اختيار من متعدد</option><option value="true_false">صح أو خطأ</option><option value="essay">مقالي</option>
                                </select>
                                <button aria-label="طي السؤال" className="rounded-full border-2 border-[#173F5F] bg-white px-3 py-2 text-[11px] font-black text-[#173F5F]" onClick={() => updateQuestion(index, { isOpen: !question.isOpen })} type="button">{question.isOpen ? "طي" : "فتح"}</button>
                              </div>
                            </div>
                            {question.isOpen && <div className="grid gap-4 border-t-2 border-[#DCE4EF] bg-white p-4">
                              <label className="text-[13px] font-black text-[#173F5F]">نص السؤال<textarea className={`${inputClass} min-h-[80px] resize-y`} onChange={(event) => updateQuestion(index, { text: event.target.value })} placeholder="اكتب السؤال هنا" required value={question.text} /></label>
                              {question.type === "mcq" && <>
                                <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">{question.choices.map((choice, choiceIndex) => <label className="text-[12px] font-black text-[#173F5F]" key={choiceIndex}>اختيار {choiceIndex + 1}<input className={inputClass} onChange={(event) => updateChoice(index, choiceIndex, event.target.value)} placeholder={`الاختيار ${choiceIndex + 1}`} required value={choice} /></label>)}</div>
                                <label className="text-[13px] font-black text-[#173F5F]">الإجابة الصحيحة<select className={inputClass} onChange={(event) => updateQuestion(index, { correctChoice: Number(event.target.value) })} value={question.correctChoice}>{question.choices.map((_, choiceIndex) => <option key={choiceIndex} value={choiceIndex}>اختيار {choiceIndex + 1}</option>)}</select></label>
                              </>}
                              {question.type === "true_false" && <label className="text-[13px] font-black text-[#173F5F]">الإجابة الصحيحة<select className={inputClass} onChange={(event) => updateQuestion(index, { correctBoolean: event.target.value === "true" })} value={String(question.correctBoolean)}><option value="true">صح</option><option value="false">خطأ</option></select></label>}
                              {question.type === "essay" && <p className="rounded-[14px] border-2 border-[#F6C445]/50 bg-[#FFF9E8] px-4 py-3 text-[13px] font-bold leading-[1.8] text-[#8A6500]">السؤال المقالي يتصحح يدويًا ورسمياً من الأدمن بعد تسليم الطالب.</p>}
                            </div>}
                          </article>
                        ))}
                      </div>

                      <button className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-dashed border-[#20639B] bg-[#EFF6FF] px-5 py-3 text-[13px] font-black text-[#20639B] cursor-pointer" onClick={addQuestion} type="button">
                        <Plus className="w-4 h-4" />
                        <span>إضافة سؤال جديد</span>
                      </button>

                      <button className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-5 py-3.5 text-[15px] font-black text-[#173F5F] shadow-[3px_3px_0_#173F5F] disabled:opacity-60 cursor-pointer" disabled={creating} onClick={() => void createHomework()} type="button">
                        {editingTemplateId ? <Save className="w-4 h-4 text-[#173F5F]" /> : <Send className="w-4 h-4 text-[#173F5F]" />}
                        <span>{creating ? "جاري الحفظ..." : editingTemplateId ? "حفظ تعديلات الواجب والأسئلة" : "نشر الواجب وحفظه بالمكتبة"}</span>
                      </button>
                    </div>
                  </section>}

                  {/* Right Column: Assign Homework to Group */}
                  {activeTab === "grading" && <section className="rounded-[26px] border-2 border-[#173F5F] bg-[#173F5F] p-6 text-white shadow-[5px_5px_0_#F6C445] h-fit">
                    <h2 className="text-[26px] font-black">ربط واجب بمجموعة وتصحيحه</h2>
                    <p className="mt-2 text-[13px] leading-[1.8] text-[#B5C9DD]">اختار الواجب الجاهز والمجموعة. الربط والنشر والتصحيح بيتم من الأدمن.</p>
                    <div className="mt-6 grid gap-4">
                      <label className="text-[13px] font-black">الواجب<select className={inputClass} onChange={(event) => setSelectedTemplateId(event.target.value)} value={selectedTemplateId}><option value="">اختار واجب</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.lesson_name} - {template.title}</option>)}</select></label>

                      {selectedTemplateId && (
                        <Link
                          href={`/admin/homeworks/${selectedTemplateId}/grading`}
                          className="inline-flex items-center justify-center gap-2 rounded-[14px] border-2 border-[#F6C445] bg-[#FFF9E8] px-4 py-2.5 text-[13px] font-black text-[#8A6500] hover:bg-[#F6C445] hover:text-[#173F5F] transition"
                        >
                          <Award className="w-4 h-4 text-[#8A6500]" />
                          <span>تصحيح ورصد إجابات الطلاب لهذا الواجب</span>
                        </Link>
                      )}

                      <label className="text-[13px] font-black">المجموعة<select className={inputClass} onChange={(event) => setSelectedGroupId(event.target.value)} value={selectedGroupId}><option value="">اختار مجموعة</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.teacher_name} · {group.center_name} · {group.name}</option>)}</select></label>
                      {selectedGroup && <div className="rounded-[16px] border border-[#B5C9DD]/40 bg-white/10 p-3 text-[12px] text-[#DCEBFA]">{selectedGroup.subject_name_ar} · {selectedGroup.students_count} طالب · {selectedGroup.schedule_slots?.map((slot) => `${dayLabels[slot.day]} ${formatTime(slot.time)}`).join("، ")}</div>}
                      <div className="rounded-[16px] border border-[#B5C9DD]/40 bg-white/10 p-4"><span className="text-[13px] font-black">ينتهي الواجب</span><div className="mt-3 grid gap-3 text-[12px] font-bold"><label className="flex items-center gap-2"><input checked={dueMode === "next_session"} name="adminDueMode" onChange={() => setDueMode("next_session")} type="radio" /> عند الحصة الجاية {calculatedDueDate && <span className="text-[#F6C445]">({calculatedDueDate.toLocaleString("ar-EG")})</span>}</label><label className="flex items-center gap-2"><input checked={dueMode === "custom"} name="adminDueMode" onChange={() => setDueMode("custom")} type="radio" /> تاريخ ووقت مخصص</label>{dueMode === "custom" && <input className={inputClass} onChange={(event) => setCustomDueDate(event.target.value)} required type="datetime-local" value={customDueDate} />}</div></div>
                      <label className="rounded-[16px] border border-[#B5C9DD]/40 bg-white/10 p-4 text-[13px] font-black">وقت حل الواجب بالدقائق<input className={inputClass} inputMode="numeric" min="1" onChange={(event) => setDurationMinutes(event.target.value)} placeholder="مثال: 30" type="number" value={durationMinutes} /><span className="mt-2 block text-[11px] font-bold text-[#B5C9DD]">يبدأ العد من أول مرة الطالب يفتح الواجب. اتركه فارغًا لو الواجب من غير مؤقت.</span></label>
                      <button className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-5 py-3 text-[14px] font-black text-[#173F5F] shadow-[3px_3px_0_#0D2F49] disabled:opacity-60 cursor-pointer" disabled={assigning} onClick={() => void assignHomework()} type="button">
                        <Send className="w-4 h-4 text-[#173F5F]" />
                        <span>{assigning ? "جاري التعيين..." : "تعيين الواجب للمجموعة"}</span>
                      </button>
                    </div>
                  </section>}
                </div>

                {/* ------------------------------------------------------------- */}
                {/* HOMEWORK LIBRARY SECTION (مكتبة الواجبات والأسئلة)             */}
                {/* ------------------------------------------------------------- */}
                <section className={`rounded-[28px] border-2 border-[#173F5F] bg-white p-8 shadow-[6px_6px_0_#173F5F] ${activeTab === "grading" ? "-order-1" : ""}`}>
                  <div className="flex items-center justify-between gap-6 border-b-2 border-[#DCE4EF] pb-6 max-md:flex-col max-md:items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-[#EFF6FF] border-2 border-[#20639B]/30 text-[#20639B]">
                        <BookOpen className="w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-[32px] font-black text-[#173F5F]">
                          {activeTab === "grading" ? "اختار واجب للتصحيح" : `مكتبة الواجبات والأسئلة (${filteredTemplates.length})`}
                        </h2>
                        <p className="mt-1 text-[14px] text-[#6B7280]">
                          {activeTab === "grading"
                            ? "اختار الواجب من القائمة لفتح إجابات الطلاب وتصحيحها مباشرةً."
                            : "جميع الواجبات التي تم إنشاؤها وقوالب الأسئلة. يمكنك تعديل الأسئلة من هنا."}
                        </p>
                      </div>
                    </div>

                    <div className="relative w-[300px] max-md:w-full">
                      <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#6B7280]" />
                      <input
                        type="text"
                        placeholder="ابحث بعنوان الواجب أو الدرس..."
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        className="w-full rounded-[14px] border-2 border-[#DCE4EF] bg-[#F7F9FC] pl-9 pr-4 py-2.5 text-[13px] font-bold text-[#173F5F] outline-none focus:border-[#20639B]"
                      />
                    </div>
                  </div>

                  {filteredTemplates.length === 0 ? (
                    <div className="mt-8 rounded-[20px] border-2 border-dashed border-[#DCE4EF] p-12 text-center text-[#6B7280]">
                      <p className="text-[16px] font-bold">لا توجد واجبات مضافة في المكتبة حتى الآن.</p>
                    </div>
                  ) : (
                    <div className="mt-8 grid grid-cols-2 gap-5 max-lg:grid-cols-1">
                      {filteredTemplates.map((template) => (
                        <article
                          key={template.id}
                          className="rounded-[22px] border-2 border-[#173F5F] bg-[#F7F9FC] p-6 shadow-[4px_4px_0_#DCE4EF] flex flex-col justify-between gap-4 transition hover:border-[#20639B]"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-black text-[#20639B] border border-[#20639B]/30">
                                الدرس: {template.lesson_name}
                              </span>
                              <span className="rounded-full bg-[#FFF9E8] px-3 py-1 text-[11px] font-black text-[#8A6500] border border-[#F6C445]/60">
                                {template.questions_count} أسئلة
                              </span>
                            </div>

                            <h3 className="text-[20px] font-black text-[#173F5F] leading-[1.3]">
                              {template.title}
                            </h3>
                            {template.description && (
                              <p className="mt-2 text-[13px] text-[#6B7280] line-clamp-2">
                                {template.description}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-3 border-t border-[#DCE4EF] pt-3">
                            {activeTab === "questions" && <button
                              type="button"
                              disabled={loadingTemplate}
                              onClick={() => void handleEditTemplate(template.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#173F5F] bg-white px-4 py-2.5 text-[12px] font-black text-[#173F5F] hover:bg-[#EFF6FF] transition cursor-pointer"
                            >
                              <PenTool className="w-3.5 h-3.5 text-[#20639B]" />
                              <span>تعديل الأسئلة</span>
                            </button>}

                            {activeTab === "grading" && <Link
                              href={`/admin/homeworks/${template.id}/grading`}
                              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-4 py-2.5 text-[12px] font-black text-[#173F5F] shadow-[2px_2px_0_#173F5F] hover:bg-[#F3B926] transition"
                            >
                              <Award className="w-3.5 h-3.5 text-[#173F5F]" />
                              <span>تصحيح الإجابات</span>
                            </Link>}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
