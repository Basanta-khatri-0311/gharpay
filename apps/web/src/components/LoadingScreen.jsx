export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-bg flex flex-col items-center justify-center gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <span className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center text-base font-bold">G</span>
        <span className="text-lg font-semibold text-text tracking-tight">GharPay</span>
      </div>

      {/* Spinner */}
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>

      <p className="text-[13px] text-text-muted">Loading your session…</p>
    </div>
  )
}
