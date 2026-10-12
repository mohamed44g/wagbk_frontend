export default function Loading() {
  return (
    <main className="fixed inset-0 z-[90] flex min-h-screen items-center justify-center bg-[#F7F9FC] text-[#173F5F]">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="relative flex size-20 items-center justify-center rounded-[24px] border-2 border-[#173F5F] bg-[#F6C445] shadow-[5px_5px_0_#173F5F]">
          <span className="text-[30px] font-black">و</span>
          <span className="absolute -right-2 -top-2 size-4 rounded-full bg-[#68AB48]" />
        </div>
        <div>
          <p className="text-[18px] font-black">واجبك</p>
          <p className="mt-1 text-[13px] font-bold text-[#6B7280]">بنجهزلك كل حاجة...</p>
        </div>
        <div className="flex items-center gap-2" aria-label="جاري التحميل" role="status">
          <span className="size-2.5 animate-bounce rounded-full bg-[#173F5F] [animation-delay:-.3s]" />
          <span className="size-2.5 animate-bounce rounded-full bg-[#F6C445] [animation-delay:-.15s]" />
          <span className="size-2.5 animate-bounce rounded-full bg-[#68AB48]" />
        </div>
      </div>
    </main>
  );
}
