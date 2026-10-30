import Link from "next/link";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  footerText: string;
  footerLabel: string;
  footerHref: string;
  children: React.ReactNode;
};

export default function AuthShell({
  eyebrow,
  title,
  description,
  footerText,
  footerLabel,
  footerHref,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F9FC] text-[#1F2937]">
      <div className="mx-auto grid min-h-screen w-full max-w-none grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="relative hidden min-w-0 overflow-hidden bg-[#173F5F] px-16 py-14 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-24 -top-24 size-[360px] rounded-full border-[42px] border-[#20639B]" />
          <div className="absolute -bottom-36 -right-28 size-[430px] rounded-full border-[52px] border-[#68AB48]/50" />
          <div className="absolute right-24 top-28 h-32 w-48 opacity-50 [background-image:radial-gradient(#20639B_2px,transparent_2px)] [background-size:18px_18px]" />

          <Link className="relative z-10 w-fit text-[34px] font-black tracking-[-1.5px] text-white" href="/">
            واجبك<span className="text-[#F6C445]">.</span>
          </Link>

          <div className="relative z-10 max-w-[520px]" data-aos="fade-up">
            <span className="inline-flex rounded-full border-2 border-[#F6C445] bg-[#20639B] px-4 py-2 text-[13px] font-black text-white">
              مذاكرة أوضح، متابعة أسرع
            </span>
            <h2 className="mt-8 text-[clamp(42px,5vw,76px)] font-black leading-[1.12] tracking-[-3px]">
              خلي واجبك
              <br />
              معاك.
            </h2>
            <p className="mt-6 max-w-[420px] text-[17px] leading-[1.9] text-[#B5C9DD]">
              كل واجباتك، نتائجك، وأخطائك في مكان واحد.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2" aria-hidden="true">
            <span className="h-3 w-20 rounded-full bg-[#F6C445]" />
            <span className="h-3 w-3 rounded-full bg-[#68AB48]" />
            <span className="h-3 w-10 rounded-full bg-[#20639B]" />
          </div>
        </section>

        <section className="flex min-h-screen min-w-0 w-full flex-col px-6 py-8 sm:px-10 lg:px-16 xl:px-20 lg:py-12">
          <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col">
            <Link className="w-fit text-[30px] font-black tracking-[-1.5px] text-[#173F5F] lg:hidden" href="/">
              واجبك<span className="text-[#F6C445]">.</span>
            </Link>

            <div className="my-auto py-10" data-aos="fade-right">
              <p className="mb-4 inline-flex items-center gap-2 text-[14px] font-extrabold text-[#20639B]">
                <span className="size-[9px] rounded-full bg-[#F6C445] shadow-[0_0_0_4px_rgba(246,196,69,.24)]" />
                {eyebrow}
              </p>
              <h1 className="text-[clamp(38px,5vw,64px)] font-black leading-[1.15] tracking-[-2px] text-[#173F5F]">{title}</h1>
              <p className="mt-4 max-w-[470px] text-[16px] leading-[1.9] text-[#6B7280]">{description}</p>
              <div className="mt-8">{children}</div>
              <p className="mt-8 text-center text-[14px] text-[#6B7280]">
                {footerText}{" "}
                <Link className="font-black text-[#20639B] underline underline-offset-4" href={footerHref}>
                  {footerLabel}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
