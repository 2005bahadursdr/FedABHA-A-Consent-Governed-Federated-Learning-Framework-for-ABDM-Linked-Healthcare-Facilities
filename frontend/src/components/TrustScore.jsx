export default function TrustScore({ score }) {
  const isGood = score > 0.8;
  const isWarn = score > 0.5 && score <= 0.8;
  const colorClass = isGood ? 'bg-emerald-500' : isWarn ? 'bg-amber-500' : 'bg-rose-500';
  const textClass = isGood ? 'text-emerald-400' : isWarn ? 'text-amber-400' : 'text-rose-400';
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">Trust Score</span>
        <span className={`font-bold ${textClass}`}>{(score * 100).toFixed(0)}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${colorClass}`} style={{ width: `${score * 100}%` }}></div>
      </div>
    </div>
  );
}
