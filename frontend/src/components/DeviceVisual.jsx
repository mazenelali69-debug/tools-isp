export default function DeviceVisual({ type }) {
  const base = "relative w-full h-[70px] rounded-xl overflow-hidden";

  const glow = "absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-transparent blur-xl";

  const ports = (
    <div className="absolute bottom-2 right-2 flex gap-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-2 h-2 bg-white/20 rounded-sm" />
      ))}
    </div>
  );

  const signal = (
    <div className="absolute top-2 left-2 flex items-center gap-2">
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
      <div className="h-1 w-20 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full" />
    </div>
  );

  const variants = {
    "4g": "bg-gradient-to-br from-blue-900 to-black",
    "5g": "bg-gradient-to-br from-purple-900 to-black",
    "ax": "bg-gradient-to-br from-green-900 to-black",
    "fiber": "bg-gradient-to-br from-orange-900 to-black",
  };

  return (
    <div className={`${base} ${variants[type] || variants["4g"]}`}>
      <div className={glow}></div>
      {signal}
      {ports}
    </div>
  );
}
