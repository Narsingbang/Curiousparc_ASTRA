export function Hero2DFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Soft Luminous Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-400/20 via-blue-500/15 to-transparent rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-medical-blue/15 via-purple-500/10 to-transparent rounded-full blur-3xl" />

      {/* Decorative Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(#0B5FFF 1px, transparent 1px), linear-gradient(to right, #0B5FFF 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}
