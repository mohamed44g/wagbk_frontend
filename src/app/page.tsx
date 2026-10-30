import Image from "next/image";

const navItems = [
  { label: "الرئيسية", href: "#top" },
  { label: "المميزات", href: "#features" },
  { label: "إزاي بيشتغل", href: "#how-it-works" },
  { label: "للمدرسين", href: "#roles" },
] as const;

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="size-[18px]" viewBox="0 0 24 24">
      <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="size-[21px]" viewBox="0 0 24 24">
      <path d="m5 12.5 4.2 4.1L19.5 6.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" className="size-[43px]" viewBox="0 0 24 24">
      <path d="M12 2.7 14 10l7.3 2-7.3 2-2 7.3L10 14l-7.3-2 7.3-2 2-7.3Z" fill="currentColor" />
    </svg>
  );
}

type FeatureIconType = "homework" | "result" | "mistakes" | "teacher";

function FeatureIcon({ type }: { type: FeatureIconType }) {
  const path =
    type === "homework"
      ? "M5 5.5h14v13H5zM8 9h8M8 12h5"
      : type === "result"
        ? "M12 4v8l5 3M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
        : type === "mistakes"
          ? "M12 4 3.8 18h16.4L12 4Zm0 5v4m0 3h.01"
          : "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19m6-8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm6-6h4m-2-2v4";

  return (
    <svg aria-hidden="true" className="size-7" fill="none" viewBox="0 0 24 24">
      <path d={path} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

const featureItems: Array<{
  icon: FeatureIconType;
  title: string;
  description: string;
  tone: string;
}> = [
  {
    icon: "homework",
    title: "واجبات منظمة",
    description: "كل واجباتك مرتبة حسب الدرس وفي مكان واحد.",
    tone: "bg-[#F6C445]",
  },
  {
    icon: "result",
    title: "نتائج فورية",
    description: "شوف نتيجتك وتقدمك فورًا بعد تسليم الواجب.",
    tone: "bg-[#68AB48]",
  },
  {
    icon: "mistakes",
    title: "بنك أخطائي",
    description: "ارجع لأخطائك وراجعها حسب كل درس عشان تتحسن.",
    tone: "bg-[#20639B]",
  },
  {
    icon: "teacher",
    title: "متابعة ذكية",
    description: "المدرس يقدر يتابع أداءك ويعرف النقاط اللي محتاجة تركيز.",
    tone: "bg-[#173F5F]",
  },
];

const steps = [
  {
    number: "01",
    title: "سجل حسابك",
    description: "انشئ حسابك برقم موبايلك في دقايق.",
    offset: "mt-0",
  },
  {
    number: "02",
    title: "انضم لمدرسك",
    description: "ادخل كود الانضمام اللي ادهولك مدرسك.",
    offset: "mt-12",
  },
  {
    number: "03",
    title: "حل واجباتك",
    description: "اختار الدرس وحل الأسئلة بخطوة بخطوة.",
    offset: "mt-24",
  },
  {
    number: "04",
    title: "راجع نتيجتك",
    description: "شوف درجتك وراجع أخطائك عشان تتقدم.",
    offset: "mt-36",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#F7F9FC] text-[#1F2937]">
      <section aria-labelledby="hero-title">
        <header className="site-header sticky top-0 z-50 mx-auto grid min-h-[108px] w-full max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-8 border-b border-[#DCE4EF]/70 bg-[#F7F9FC]/95 px-8 backdrop-blur-md max-md:min-h-[78px] max-md:px-4 max-md:grid-cols-[1fr_auto]">
          <a className="inline-flex justify-self-start items-center" href="#top" aria-label="واجبك - الرئيسية">
            <Image className="brand-logo-header h-auto w-[108px] max-md:w-[84px]" src="/images/wagbk-wordmark.png" alt="واجبك" width={760} height={680} priority />
          </a>

          <nav className="flex items-center gap-8 text-[15px] font-bold text-[#173F5F] max-md:hidden" aria-label="التنقل الرئيسي">
            {navItems.map((item) => (
              <a className="transition hover:-translate-y-0.5 hover:text-[#173F5F]" href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex justify-self-end items-center gap-5 font-extrabold max-md:gap-0">
            <a className="text-[15px] text-[#173F5F] max-md:hidden" href="/login?role=teacher">
              دخول المدرس
            </a>
            <a className="rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-6 py-2.5 text-[14px] text-[#173F5F] shadow-[4px_4px_0_#173F5F] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#173F5F] max-md:px-4 max-md:py-2 max-md:text-[12px]" href="/login?role=student">
              دخول الطالب
            </a>
          </div>
        </header>

        <div className="mx-auto grid min-h-[570px] w-[calc(100%-6rem)] max-w-[1400px] translate-y-10 grid-cols-[minmax(650px,760px)_minmax(500px,560px)] items-center justify-between gap-8 pt-[18px] max-lg:flex max-lg:w-[calc(100%-4rem)] max-lg:translate-y-0 max-lg:flex-col max-lg:gap-8 max-lg:pt-9 max-md:w-[calc(100%-2rem)] max-md:gap-5" id="top">
          <div className="z-10 w-full translate-y-12 justify-self-end self-center pb-4 max-lg:mx-auto max-lg:max-w-[700px] max-lg:translate-y-0 max-lg:text-center max-md:pb-0" data-aos="fade-left">
            <p className="mb-4 inline-flex items-center gap-2 text-[14px] font-extrabold text-[#20639B]">
              <span className="size-[9px] rounded-full bg-[#F6C445] shadow-[0_0_0_4px_rgba(246,196,69,.24)]" />
              وداعًا لنظام الواجبات التقليدي.. أهلًا بالحل الذكي
            </p>

            <h1 className="max-w-[680px] text-[clamp(48px,5vw,74px)] font-black leading-[1.15] tracking-[-3.5px] text-[#173F5F] max-md:max-w-[520px] max-md:text-[clamp(38px,11.5vw,54px)] max-md:tracking-[-2px]" id="hero-title">
              إدارة أذكى للواجبات.. ومتابعة أسهل للطلاب
            </h1>

            <p className="mt-5 max-w-[400px] text-[17px] font-medium leading-[1.95] text-[#1F2937] max-md:max-w-[480px] max-md:text-[15px]">
              كل واجباتك، درجاتك، وأخطائك المهمة في مكان واحد عشان تراجع أسرع وتوصل لنتيجة أحسن.
            </p>

            <div className="mt-7 flex items-center gap-[22px] max-lg:justify-center max-md:flex-col max-md:items-stretch max-md:gap-3">
              <a className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#173F5F] bg-[#F6C445] px-5 py-3 text-[15px] font-black text-[#173F5F] shadow-[4px_4px_0_#173F5F] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#173F5F]" href="/login?role=student">
                ابدأ دلوقتي
                <ArrowIcon />
              </a>
              <a className="text-center text-[14px] font-extrabold text-[#20639B] underline decoration-1 underline-offset-[5px]" href="#how-it-works">
                شوف إزاي بيشتغل
              </a>
            </div>

            <div className="mt-10 flex w-full items-center justify-end gap-[7px] [direction:ltr] max-lg:justify-center max-md:mt-8" aria-hidden="true">
              <span className="h-[26px] w-[78px] rounded-full bg-[#173F5F] shadow-[0_4px_0_rgba(23,63,95,.14)]" />
              <span className="h-[26px] w-8 rounded-full bg-[#F6C445] shadow-[0_4px_0_rgba(23,63,95,.14)]" />
              <span className="h-[26px] w-[17px] rounded-full bg-[#20639B] shadow-[0_4px_0_rgba(23,63,95,.14)]" />
              <span className="h-[26px] w-[45px] rounded-full bg-[#68AB48] shadow-[0_4px_0_rgba(23,63,95,.14)]" />
            </div>

          </div>

          <div className="relative isolate min-h-[570px] w-[560px] justify-self-start max-lg:mx-auto max-lg:min-h-[520px] max-lg:w-full max-lg:max-w-[560px] max-lg:self-center max-md:mt-0 max-md:min-h-[430px] max-sm:min-h-[390px]" aria-label="طالب يستخدم منصة واجبك" data-aos="fade-right">
            <div className="absolute right-[43px] top-[92px] -z-20 h-[416px] w-[394px] rotate-[-6deg] rounded-[44%_46%_32%_48%] bg-[#173F5F] max-md:right-[4%] max-md:top-[92px] max-md:h-[min(80vw,400px)] max-md:w-[min(77vw,385px)]" />
            <div className="absolute right-[62px] top-[74px] -z-20 h-[425px] w-[395px] rotate-[-6deg] rounded-[47%_34%_49%_35%] bg-[#20639B] max-md:right-[8%] max-md:top-20 max-md:h-[min(81vw,405px)] max-md:w-[min(77vw,385px)]" />
            <div className="absolute right-[100px] top-[54px] -z-20 h-[432px] w-[390px] rotate-[-6deg] rounded-[42%_49%_40%_46%] bg-[#F6C445] max-md:right-[14%] max-md:top-[65px] max-md:h-[min(82vw,410px)] max-md:w-[min(76vw,380px)]" />
            <div className="absolute right-[35px] top-7 -z-30 h-[180px] w-[220px] opacity-90 [background-image:radial-gradient(#F6C445_2px,transparent_2px)] [background-size:16px_16px]" />

            <div className="absolute left-0 top-16 z-30 grid gap-2 max-lg:-left-[18px] max-md:left-[1%] max-md:top-[38px] max-md:gap-[5px]" aria-label="مواد دراسية">
              {["رياضيات", "فيزياء", "لغة عربية", "كيمياء"].map((subject, index) => (
                <span className={`hero-subject ${index === 0 ? "hero-subject-active" : ""} min-w-[132px] rounded-full border-2 border-[#173F5F] bg-[#F7F9FC]/95 px-[18px] py-[9px] text-center text-[13px] font-extrabold text-[#173F5F] shadow-[4px_4px_0_#173F5F] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#173F5F] max-md:min-w-[90px] max-md:px-2 max-md:py-[6px] max-md:text-[10px] ${index === 0 ? "bg-[#F6C445]" : ""}`} key={subject}>
                  {subject}
                </span>
              ))}
            </div>

            <Image
              className="absolute bottom-0 right-[105px] z-10 h-auto w-[470px] max-w-[75%] drop-shadow-[0_18px_10px_rgba(23,63,95,.14)] max-md:right-[8%] max-md:w-[clamp(270px,65vw,350px)] max-md:max-w-[76vw]"
              src="/images/hero-student.png"
              alt="طالب يحمل هاتفه ودفتر مذاكرة"
              width={1086}
              height={1448}
              preload
              sizes="(max-width: 760px) 92vw, (max-width: 1100px) 48vw, 540px"
            />

            <article className="absolute bottom-[82px] -left-3 z-40 flex w-[245px] rotate-[3deg] items-start gap-3 rounded-[18px] border-2 border-[#173F5F] bg-white p-4 shadow-[7px_7px_0_#173F5F] max-lg:-left-[25px] max-md:bottom-[68px] max-md:left-0 max-md:w-[212px] max-md:p-[13px] max-sm:bottom-[47px] max-sm:w-[188px] max-sm:gap-2 max-sm:rounded-[14px]">
              <div className="grid size-[35px] shrink-0 place-items-center rounded-full bg-[#F6C445] text-[#173F5F]">
                <CheckIcon />
              </div>
              <div>
                <strong className="block text-[15px] text-[#173F5F]">متابعة ذكية</strong>
                <p className="mt-1 text-[11px] leading-[1.65] text-[#6B7280] max-sm:text-[10px]">اعرف المطلوب منك وخلّص واجباتك خطوة بخطوة.</p>
              </div>
            </article>

            <div className="absolute right-[52px] top-[50px] z-30 rotate-[13deg] text-[#F6C445] max-sm:right-[9%] max-sm:top-14" aria-hidden="true">
              <SparkIcon />
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-[calc(100%-6rem)] max-w-[1400px] grid-cols-2 items-end gap-10 pb-[38px] [direction:ltr] max-lg:w-[calc(100%-4rem)] max-md:flex max-md:w-[calc(100%-3rem)] max-md:flex-col max-md:items-stretch max-md:gap-7 max-md:pb-[34px]">
          <div className="hidden" aria-hidden="true">
            <div className="flex items-center justify-between gap-3 border-b border-[#DCE4EF] pb-3 text-[13px] font-black text-[#173F5F]">
              <span>واجب النهارده</span>
              <span className="text-[11px] text-[#68AB48]">متبقي 3 أسئلة</span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-[13px]">
              <span className="grid size-[27px] place-items-center rounded-[9px] bg-[#F6C445] text-[12px] font-black text-[#173F5F]">01</span>
              <p className="m-0 flex-1 text-[12px] font-bold text-[#1F2937]">اختار الإجابة الصحيحة وكسب شارت التقدّم.</p>
              <div className="h-[7px] w-[58px] overflow-hidden rounded-full bg-[#DCE4EF]"><i className="block h-full w-[62%] rounded-full bg-[#20639B]" /></div>
            </div>
          </div>


        </div>
      </section>

      <section className="border-t-2 border-[#DCE4EF] bg-white/60 py-24 max-md:py-16" id="features">
        <div className="mx-auto w-[calc(100%-6rem)] max-w-[1400px] max-lg:w-[calc(100%-4rem)] max-md:w-[calc(100%-3rem)]">
          <div className="mb-12 max-w-[650px]" data-aos="fade-up">
            <p className="mb-4 inline-flex items-center gap-2 text-[14px] font-extrabold text-[#20639B]">
              <span className="size-[9px] rounded-full bg-[#F6C445] shadow-[0_0_0_4px_rgba(246,196,69,.24)]" />
              مميزات واجبك
            </p>
            <h2 className="max-w-[620px] text-[clamp(34px,4vw,58px)] font-black leading-[1.2] tracking-[-2px] text-[#173F5F]">
              كل اللي تحتاجه عشان تذاكر بثقة.
            </h2>
            <p className="mt-5 max-w-[560px] text-[17px] leading-[1.9] text-[#6B7280]">
              من ترتيب الواجبات لحد متابعة التقدم، واجبك مصمم عشان يخلي مذاكرتك أوضح وأسرع.
            </p>
          </div>

          <div className="hidden">
            {featureItems.map((feature, index) => (
              <article className="group relative min-h-[245px] rounded-[24px] border-2 border-[#173F5F] bg-[#F7F9FC] p-6 shadow-[5px_5px_0_#173F5F] transition duration-200 hover:-translate-y-1 hover:shadow-[7px_7px_0_#173F5F]" data-aos="fade-up" data-aos-delay={index * 100} key={feature.title}>
                <div className={`grid size-[58px] place-items-center rounded-[18px] text-white shadow-[3px_3px_0_#173F5F] ${feature.tone}`}>
                  <FeatureIcon type={feature.icon} />
                </div>
                <span className="absolute left-6 top-6 text-[14px] font-black text-[#B5C2D0]">0{index + 1}</span>
                <h3 className="mt-8 text-[22px] font-black text-[#173F5F]">{feature.title}</h3>
                <p className="mt-3 text-[14px] leading-[1.85] text-[#6B7280]">{feature.description}</p>
              </article>
            ))}
          </div>

          <div className="relative mt-16 grid grid-cols-3 items-center gap-10 max-lg:grid-cols-2 max-lg:gap-12 max-md:grid-cols-1 max-md:gap-8">
            <div className="space-y-14 max-md:space-y-8">
              {featureItems.slice(0, 2).map((feature, index) => (
                <div className="group border-b-2 border-[#DCE4EF] pb-6" data-aos="fade-left" data-aos-delay={index * 120} key={feature.title}>
                  <div className="flex items-start gap-4">
                    <div className={`grid size-[58px] shrink-0 place-items-center rounded-[20px] text-[#173F5F] shadow-[3px_3px_0_#173F5F] transition group-hover:rotate-6 ${feature.tone}`}>
                      <FeatureIcon type={feature.icon} />
                    </div>
                    <div>
                      <span className="text-[12px] font-black text-[#9AA8B8]">0{index + 1}</span>
                      <h3 className="mt-1 text-[22px] font-black text-[#173F5F]">{feature.title}</h3>
                      <p className="mt-2 text-[14px] leading-[1.8] text-[#6B7280]">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mx-auto grid size-[330px] place-items-center max-lg:order-first max-lg:col-span-2 max-md:col-span-1 max-md:size-[280px]" data-aos="zoom-in">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#20639B]/60" />
              <div className="absolute inset-7 rounded-full border-[22px] border-[#F6C445]/70" />
              <div className="absolute -right-1 top-10 size-7 rotate-45 rounded-[8px] bg-[#68AB48] shadow-[3px_3px_0_#173F5F]" />
              <div className="absolute -bottom-2 left-10 h-4 w-20 rounded-full bg-[#20639B] shadow-[3px_3px_0_#173F5F]" />
              <div className="relative grid size-[190px] rotate-[-5deg] place-items-center rounded-[42%_58%_48%_52%] border-2 border-[#173F5F] bg-[#F6C445] text-center shadow-[7px_7px_0_#173F5F] transition duration-300 hover:rotate-0">
                <div className="rotate-[5deg]">
                  <span className="text-[13px] font-black text-[#20639B]">منصة واحدة</span>
                  <strong className="mt-2 block text-[42px] font-black tracking-[-2px] text-[#173F5F]">واجبك</strong>
                  <span className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#173F5F]">إدارة أذكى. متابعة أسهل.</span>
                </div>
              </div>
            </div>

            <div className="space-y-14 max-md:space-y-8">
              {featureItems.slice(2).map((feature, index) => (
                <div className="group border-b-2 border-[#DCE4EF] pb-6" data-aos="fade-right" data-aos-delay={index * 120} key={feature.title}>
                  <div className="flex items-start gap-4">
                    <div className={`grid size-[58px] shrink-0 place-items-center rounded-[20px] text-white shadow-[3px_3px_0_#173F5F] transition group-hover:rotate-6 ${feature.tone}`}>
                      <FeatureIcon type={feature.icon} />
                    </div>
                    <div>
                      <span className="text-[12px] font-black text-[#9AA8B8]">0{index + 3}</span>
                      <h3 className="mt-1 text-[22px] font-black text-[#173F5F]">{feature.title}</h3>
                      <p className="mt-2 text-[14px] leading-[1.8] text-[#6B7280]">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t-2 border-[#20639B] bg-[#173F5F] py-24 max-md:py-16" id="how-it-works">
        <div className="mx-auto w-[calc(100%-6rem)] max-w-[1400px] max-lg:w-[calc(100%-4rem)] max-md:w-[calc(100%-3rem)]">
          <div className="mb-14 max-w-[650px]">
            <p className="mb-4 inline-flex items-center gap-2 text-[14px] font-extrabold text-[#F6C445]">
              <span className="size-[9px] rounded-full bg-[#68AB48] shadow-[0_0_0_4px_rgba(104,171,72,.2)]" />
              ازاي واجبك بيشتغل
            </p>
            <h2 className="max-w-[620px] text-[clamp(34px,4vw,58px)] font-black leading-[1.2] tracking-[-2px] text-white">
              ابدأ مشوارك في 4 خطوات بسيطة.
            </h2>
          </div>

          <div className="relative">
            <div className="grid grid-cols-4 gap-8 max-lg:grid-cols-2 max-md:grid-cols-1 max-md:gap-10">
              {steps.map((step, index) => (
                <div className={`relative flex flex-col items-center text-center ${step.offset} max-lg:mt-0`} data-aos="zoom-in" data-aos-delay={index * 120} key={step.number}>
                  <div className="relative z-10 grid size-[126px] place-items-center rounded-full border-2 border-[#F6C445] bg-[#F6C445] shadow-[6px_6px_0_#20639B] transition duration-300 hover:rotate-6 hover:shadow-[9px_9px_0_#20639B]">
                    <span className="text-[32px] font-black text-[#173F5F]">{step.number}</span>
                    <span className="absolute -right-2 -top-2 size-5 rotate-45 rounded-[5px] bg-[#68AB48]" />
                  </div>
                  <div className="mt-8 max-w-[235px]">
                    <h3 className="text-[23px] font-black text-white">{step.title}</h3>
                    <p className="mt-3 text-[14px] leading-[1.85] text-[#B5C9DD]">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && <span className="absolute -left-7 top-[48px] text-[34px] font-black text-[#F6C445] max-lg:hidden">←</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t-2 border-[#DCE4EF] bg-white py-24 max-md:py-16" id="roles">
        <div className="mx-auto w-[calc(100%-6rem)] max-w-[1400px] max-lg:w-[calc(100%-4rem)] max-md:w-[calc(100%-3rem)]">
          <div className="mx-auto mb-14 max-w-[700px] text-center">
            <p className="mb-4 inline-flex items-center gap-2 text-[14px] font-extrabold text-[#20639B]">
              <span className="size-[9px] rounded-full bg-[#F6C445] shadow-[0_0_0_4px_rgba(246,196,69,.24)]" />
              منصة واحدة، تجربتين
            </p>
            <h2 className="text-[clamp(34px,4vw,58px)] font-black leading-[1.2] tracking-[-2px] text-[#173F5F]">
              مصممة للطالب والمدرس.
            </h2>
            <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-[1.9] text-[#6B7280]">
              كل طرف له الأدوات اللي محتاجها، والاتنين متربطين في نفس المكان.
            </p>
          </div>

          <div className="relative grid grid-cols-2 gap-8 max-lg:grid-cols-1 max-lg:gap-6">
            <div className="absolute left-1/2 top-1/2 z-30 grid size-[112px] -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] place-items-center rounded-[28px] border-2 border-[#173F5F] bg-[#F6C445] text-center text-[14px] font-black leading-[1.4] text-[#173F5F] shadow-[5px_5px_0_#173F5F] max-lg:hidden">
              واجبك<br />بيجمعنا
            </div>

            <article className="group relative min-h-[420px] overflow-hidden rounded-[36px] border-2 border-[#173F5F] bg-[#F6C445] p-8 shadow-[8px_8px_0_#173F5F] transition duration-300 hover:-rotate-1 hover:shadow-[12px_12px_0_#173F5F] max-md:min-h-[390px] max-md:p-6" data-aos="fade-up">
              <div className="absolute -left-16 -top-16 size-[230px] rounded-full border-[28px] border-[#68AB48]/60" />
              <div className="absolute -bottom-24 right-12 size-[260px] rounded-full border-[34px] border-white/30" />
              <div className="relative z-10 flex h-full min-h-[350px] flex-col justify-between">
                <div className="max-w-[330px]">
                  <span className="inline-flex rounded-full border-2 border-[#173F5F] bg-white/70 px-4 py-2 text-[12px] font-black text-[#173F5F]">
                    للطالب
                  </span>
                  <h3 className="mt-7 text-[clamp(30px,3.2vw,48px)] font-black leading-[1.15] tracking-[-1.5px] text-[#173F5F]">
                    ذاكر<br />بروقك.
                  </h3>
                  <p className="mt-4 max-w-[290px] text-[15px] font-medium leading-[1.8] text-[#173F5F]">
                    واجباتك، درجاتك، وأخطائك كلها قدامك بوضوح.
                  </p>
                </div>
                <div className="flex max-w-[300px] flex-wrap gap-2">
                  <span className="rounded-full border-2 border-[#173F5F] bg-white px-3 py-2 text-[11px] font-black text-[#173F5F]">واجبات مرتبة</span>
                  <span className="rounded-full border-2 border-[#173F5F] bg-white px-3 py-2 text-[11px] font-black text-[#173F5F]">نتائج فورية</span>
                  <span className="rounded-full border-2 border-[#173F5F] bg-white px-3 py-2 text-[11px] font-black text-[#173F5F]">بنك أخطاء</span>
                </div>
              </div>
              <span className="absolute bottom-6 left-8 text-[72px] font-black leading-none text-[#173F5F]/15">01</span>
            </article>

            <article className="group relative min-h-[420px] overflow-hidden rounded-[36px] border-2 border-[#173F5F] bg-[#173F5F] p-8 shadow-[8px_8px_0_#F6C445] transition duration-300 hover:rotate-1 hover:shadow-[12px_12px_0_#F6C445] max-md:min-h-[390px] max-md:p-6" data-aos="fade-up" data-aos-delay="150">
              <div className="absolute -right-20 -top-20 size-[260px] rounded-full border-[30px] border-[#20639B]" />
              <div className="absolute -bottom-24 left-10 size-[250px] rounded-full border-[32px] border-[#68AB48]/50" />
              <div className="relative z-10 flex h-full min-h-[350px] flex-col justify-between">
                <div className="max-w-[330px]">
                  <span className="inline-flex rounded-full border-2 border-[#F6C445] bg-[#20639B] px-4 py-2 text-[12px] font-black text-white">
                    للمدرس
                  </span>
                  <h3 className="mt-7 text-[clamp(30px,3.2vw,48px)] font-black leading-[1.15] tracking-[-1.5px] text-white">
                    ادير<br />بذكاء.
                  </h3>
                  <p className="mt-4 max-w-[290px] text-[15px] font-medium leading-[1.8] text-[#D7E4F0]">
                    شوف أداء طلابك واعرف مين محتاج دعم ومتابعة أكتر.
                  </p>
                </div>
                <div className="flex max-w-[310px] flex-wrap gap-2">
                  <span className="rounded-full border border-[#B5C9DD] bg-[#20639B] px-3 py-2 text-[11px] font-black text-white">متابعة المجموعات</span>
                  <span className="rounded-full border border-[#B5C9DD] bg-[#20639B] px-3 py-2 text-[11px] font-black text-white">تقارير ودرجات</span>
                  <span className="rounded-full border border-[#B5C9DD] bg-[#20639B] px-3 py-2 text-[11px] font-black text-white">تصحيح مرن</span>
                </div>
              </div>
              <span className="absolute bottom-6 right-8 text-[72px] font-black leading-none text-white/10">02</span>
            </article>
          </div>
        </div>
      </section>


       <section className="border-t-2 border-[#DCE4EF] bg-[#F7F9FC] py-24 max-md:py-16" id="progress">
        <div className="mx-auto grid w-[calc(100%-6rem)] max-w-[1400px] grid-cols-2 items-center gap-16 max-lg:w-[calc(100%-4rem)] max-lg:gap-10 max-md:flex max-md:w-[calc(100%-3rem)] max-md:flex-col max-md:items-stretch">
          <div className="max-w-[560px]" data-aos="fade-left">
            <p className="mb-4 inline-flex items-center gap-2 text-[14px] font-extrabold text-[#20639B]">
              <span className="size-[9px] rounded-full bg-[#68AB48] shadow-[0_0_0_4px_rgba(104,171,72,.2)]" />
              تقدمك في مكان واحد
            </p>
            <h2 className="max-w-[540px] text-[clamp(34px,4vw,58px)] font-black leading-[1.2] tracking-[-2px] text-[#173F5F]">
              تابع تقدمك بسهولة.
            </h2>
            <p className="mt-5 max-w-[500px] text-[17px] leading-[1.9] text-[#6B7280]">
              اعرف انت انجزت قد ايه، وايه اللي محتاج تراجعه، وخلي كل خطوة في مذاكرتك واضحة قدامك.
            </p>
            <div className="mt-8 grid gap-4">
              <div className="flex items-center gap-3 text-[15px] font-bold text-[#173F5F]">
                <span className="grid size-7 place-items-center rounded-full bg-[#68AB48] text-white">✓</span>
                متابعة الواجبات المكتملة والمتبقية
              </div>
              <div className="flex items-center gap-3 text-[15px] font-bold text-[#173F5F]">
                <span className="grid size-7 place-items-center rounded-full bg-[#68AB48] text-white">✓</span>
                بنك أخطاء مرتب حسب كل درس
              </div>
              <div className="flex items-center gap-3 text-[15px] font-bold text-[#173F5F]">
                <span className="grid size-7 place-items-center rounded-full bg-[#68AB48] text-white">✓</span>
                رؤية واضحة لمستواك وتقدمك
              </div>
            </div>
          </div>

          <div className="relative rounded-[30px] border-2 border-[#173F5F] bg-white p-6 shadow-[7px_7px_0_#173F5F] max-md:p-4" data-aos="fade-right">
            <div className="flex items-center justify-between border-b border-[#DCE4EF] pb-5">
              <div>
                <p className="text-[12px] font-bold text-[#6B7280]">ملخص مذاكرتك</p>
                <h3 className="mt-1 text-[22px] font-black text-[#173F5F]">الأسبوع ده</h3>
              </div>
              <span className="rounded-full bg-[#F6C445] px-4 py-2 text-[12px] font-black text-[#173F5F]">ممتاز</span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-[18px] bg-[#F7F9FC] p-4">
                <span className="text-[11px] font-bold text-[#6B7280]">إنجازك</span>
                <strong className="mt-2 block text-[28px] font-black text-[#173F5F]">72%</strong>
              </div>
              <div className="rounded-[18px] bg-[#F7F9FC] p-4">
                <span className="text-[11px] font-bold text-[#6B7280]">الواجبات</span>
                <strong className="mt-2 block text-[28px] font-black text-[#173F5F]">12</strong>
              </div>
              <div className="rounded-[18px] bg-[#F7F9FC] p-4">
                <span className="text-[11px] font-bold text-[#6B7280]">الأخطاء</span>
                <strong className="mt-2 block text-[28px] font-black text-[#173F5F]">08</strong>
              </div>
            </div>

            <div className="mt-6 rounded-[20px] border border-[#DCE4EF] p-5">
              <div className="flex items-center justify-between text-[12px] font-black text-[#173F5F]">
                <span>تقدم الأسبوع</span>
                <span className="text-[#68AB48]">+18% عن الأسبوع اللي فات</span>
              </div>
              <div className="mt-6 flex h-[110px] items-end justify-between gap-3 border-b border-[#DCE4EF] px-2">
                <span className="h-[42%] w-full rounded-t-full bg-[#20639B]" />
                <span className="h-[58%] w-full rounded-t-full bg-[#20639B]" />
                <span className="h-[50%] w-full rounded-t-full bg-[#F6C445]" />
                <span className="h-[78%] w-full rounded-t-full bg-[#20639B]" />
                <span className="h-[68%] w-full rounded-t-full bg-[#20639B]" />
                <span className="h-[92%] w-full rounded-t-full bg-[#68AB48]" />
                <span className="h-[72%] w-full rounded-t-full bg-[#173F5F]" />
              </div>
              <div className="mt-3 flex justify-between text-[10px] font-bold text-[#9AA8B8]">
                <span>الأحد</span><span>الاثنين</span><span>الثلاثاء</span><span>الأربعاء</span><span>الخميس</span><span>الجمعة</span><span>السبت</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t-2 border-[#DCE4EF] bg-white py-24 max-md:py-16" id="faq">
        <div className="mx-auto grid w-[calc(100%-6rem)] max-w-[1400px] grid-cols-[.8fr_1.2fr] items-start gap-16 max-lg:w-[calc(100%-4rem)] max-lg:grid-cols-1 max-lg:gap-10 max-md:w-[calc(100%-3rem)]">
          <div className="rounded-[30px] border-2 border-[#173F5F] bg-[#F6C445] p-8 shadow-[7px_7px_0_#173F5F] max-lg:max-w-[620px]" data-aos="fade-left">
            <p className="mb-4 inline-flex items-center gap-2 text-[14px] font-extrabold text-[#173F5F]">
              <span className="size-[9px] rounded-full bg-[#68AB48] shadow-[0_0_0_4px_rgba(104,171,72,.22)]" />
              مساعدة سريعة
            </p>
            <h2 className="max-w-[420px] text-[clamp(34px,4vw,55px)] font-black leading-[1.2] tracking-[-2px] text-[#173F5F]">
              ليك سؤال؟
            </h2>
            <p className="mt-5 max-w-[390px] text-[16px] leading-[1.9] text-[#173F5F]">
              جمعنالك الإجابات اللي ممكن تحتاجها قبل ما تبدأ. ولو مالقيتش اللي بتدور عليه، احنا موجودين نساعدك.
            </p>
            <a className="mt-8 inline-flex rounded-full border-2 border-[#173F5F] bg-white px-6 py-3 text-[14px] font-black text-[#173F5F] shadow-[4px_4px_0_#173F5F] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#173F5F]" href="#join-center">
              ابدأ الآن
            </a>
          </div>

          <div data-aos="fade-right">
            <p className="mb-4 inline-flex items-center gap-2 text-[14px] font-extrabold text-[#20639B]">
              <span className="size-[9px] rounded-full bg-[#F6C445] shadow-[0_0_0_4px_rgba(246,196,69,.24)]" />
              FAQ
            </p>
            <h2 className="max-w-[620px] text-[clamp(34px,4vw,58px)] font-black leading-[1.2] tracking-[-2px] text-[#173F5F]">
              الأسئلة الأكثر شيوعًا.
            </h2>
            <div className="mt-8 grid gap-3">
              <details className="group rounded-[18px] border-2 border-[#173F5F] bg-[#F7F9FC] p-5 shadow-[3px_3px_0_#DCE4EF]" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[16px] font-black text-[#173F5F] [&::-webkit-details-marker]:hidden">
                  <span>ازاي الطالب ينضم للمدرس؟</span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F6C445] text-[22px] font-medium leading-none text-[#173F5F] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-[650px] text-[14px] leading-[1.9] text-[#6B7280]">
                  بعد ما يسجل الطالب حسابه، يدخل كود الانضمام اللي المدرس بيدهوله ليه، وكده ينضم للمجموعة مباشرة.
                </p>
              </details>
              <details className="group rounded-[18px] border-2 border-[#DCE4EF] bg-white p-5 transition hover:border-[#173F5F]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[16px] font-black text-[#173F5F] [&::-webkit-details-marker]:hidden">
                  <span>ايه أنواع الأسئلة اللي يمكن تحلها؟</span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F7F9FC] text-[22px] font-medium leading-none text-[#173F5F] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-[14px] leading-[1.9] text-[#6B7280]">
                  المنصة بتدعم الاختيار من متعدد، صح أو خطأ، والأسئلة المقالية اللي المدرس يقدر يراجعها ويصححها.
                </p>
              </details>
              <details className="group rounded-[18px] border-2 border-[#DCE4EF] bg-white p-5 transition hover:border-[#173F5F]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[16px] font-black text-[#173F5F] [&::-webkit-details-marker]:hidden">
                  <span>هل النتيجة بتظهر فورًا؟</span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F7F9FC] text-[22px] font-medium leading-none text-[#173F5F] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-[14px] leading-[1.9] text-[#6B7280]">
                  أه، النتيجة بتظهر مباشرة للأسئلة اللي بتتصحح تلقائيًا، والأخطاء بتتحفظ تلقائيًا في بنك أخطائك.
                </p>
              </details>
              <details className="group rounded-[18px] border-2 border-[#DCE4EF] bg-white p-5 transition hover:border-[#173F5F]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[16px] font-black text-[#173F5F] [&::-webkit-details-marker]:hidden">
                  <span>هل المنصة مناسبة للمدرسين؟</span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F7F9FC] text-[22px] font-medium leading-none text-[#173F5F] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-[14px] leading-[1.9] text-[#6B7280]">
                  أه، المدرس يقدر ينشئ سناتر ومجموعات، يعمل واجبات، ويتابع الدرجات وأداء الطلاب من مكان واحد.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#173F5F] py-28 text-center max-md:py-20" id="join-center">
        <div className="absolute inset-0 -z-10 opacity-45 [background-image:radial-gradient(#20639B_2px,transparent_2px)] [background-size:44px_44px]" />
        <div className="relative mx-auto w-[calc(100%-6rem)] max-w-[900px] max-lg:w-[calc(100%-4rem)] max-md:w-[calc(100%-3rem)]" data-aos="fade-up">
          <h2 className="text-[clamp(34px,4vw,58px)] font-black leading-[1.2] tracking-[-2px] text-white">
            جاهز توفر وقتك؟
          </h2>
          <p className="mx-auto mt-5 max-w-[680px] text-[17px] leading-[1.9] text-[#B5C9DD]">
            انضم لمئات المعلمين اللي غيروا طريقة إدارتهم للدروس، وسجل سنترك في أقل من دقيقتين.
          </p>
          <a className="mt-8 inline-flex items-center justify-center border-2 border-[#F6C445] bg-[#F6C445] px-10 py-4 text-[16px] font-black text-[#173F5F] shadow-[5px_5px_0_#20639B] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#20639B]" href="/register?role=teacher">
            سجل سنترك الآن
          </a>
        </div>
      </section>
      <footer className="border-t border-[#20639B] bg-[#0F2F47] text-white" data-aos="fade-up" id="footer">
        <div className="mx-auto w-[calc(100%-6rem)] max-w-[1400px] py-16 max-lg:w-[calc(100%-4rem)] max-md:w-[calc(100%-3rem)]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr] gap-12 max-lg:grid-cols-2 max-md:grid-cols-1 max-md:gap-10">
            <div className="max-w-[300px]">
              <a className="inline-flex" href="#top" aria-label="واجبك - الرئيسية">
                <Image className="brand-logo-footer h-auto w-[210px] max-md:w-[190px]" src="/images/wagbk-logo.png" alt="شعار واجبك" width={1070} height={770} />
              </a>
              <p className="mt-5 text-[14px] leading-[1.9] text-[#B5C9DD]">
                منصة تعليمية لإدارة الواجبات وتصحيحها ورصد الدرجات ومتابعة أداء الطلاب بسهولة، مع تنظيم الواجبات وإتاحة مراجعة الأخطاء ومراقبة المستوى في مكان واحد.
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-black text-[#F6C445]">استكشف</h3>
              <div className="mt-5 grid gap-3 text-[14px] text-[#D7E4F0]">
                <a className="transition hover:text-white" href="#features">المميزات</a>
                <a className="transition hover:text-white" href="#how-it-works">ازاي بيشتغل</a>
                <a className="transition hover:text-white" href="#progress">تابع تقدمك</a>
                <a className="transition hover:text-white" href="#faq">الأسئلة الشائعة</a>
              </div>
            </div>
            <div>
              <h3 className="text-[15px] font-black text-[#F6C445]">انضم لواجبك</h3>
              <div className="mt-5 grid gap-3 text-[14px] text-[#D7E4F0]">
                <a className="transition hover:text-white" href="/login?role=student">دخول الطالب</a>
                <a className="transition hover:text-white" href="/login?role=teacher">دخول المدرس</a>
                <a className="transition hover:text-white" href="#join-center">سجل سنترك</a>
              </div>
            </div>
            <div className="rounded-[22px] border border-[#20639B] bg-[#173F5F] p-5">
              <h3 className="text-[18px] font-black text-white">خلي مذاكرتك أوضح.</h3>
              <p className="mt-3 text-[13px] leading-[1.8] text-[#B5C9DD]">ابدأ الخطوة الأولى وخلي واجبك معاك في كل خطوة.</p>
              <a className="mt-5 inline-flex rounded-full border-2 border-[#F6C445] bg-[#F6C445] px-5 py-2.5 text-[13px] font-black text-[#173F5F] shadow-[3px_3px_0_#20639B]" href="#join-center">ابدأ دلوقتي</a>
            </div>
          </div>
          <div className="mt-14 flex items-center justify-between gap-4 border-t border-[#20639B]/60 pt-6 text-[12px] text-[#9DB5CA] max-md:flex-col max-md:items-start">
            <span>© 2026 واجبك. جميع الحقوق محفوظة.</span>
            <span>مصمم للمذاكرة الأوضح والمتابعة الأسرع.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
