export default function ConsentStatus({ approved, blocked, revoked }) {
  return (
    <div className="flex gap-3 lg:gap-1 xl:gap-2">
      <div className="bg-blue-400/10 text-blue-400 p-3 lg:p-1.5 xl:p-2 rounded-lg flex-1 text-center min-w-0">
        <div className="text-2xl lg:text-lg xl:text-xl font-bold truncate">{approved}</div>
        <div className="text-xs lg:text-[9px] xl:text-[10px] uppercase truncate">Approved</div>
      </div>
      <div className="bg-rose-400/10 text-rose-400 p-3 lg:p-1.5 xl:p-2 rounded-lg flex-1 text-center min-w-0">
        <div className="text-2xl lg:text-lg xl:text-xl font-bold truncate">{blocked}</div>
        <div className="text-xs lg:text-[9px] xl:text-[10px] uppercase truncate">Blocked</div>
      </div>
      <div className="bg-slate-400/10 text-slate-400 p-3 lg:p-1.5 xl:p-2 rounded-lg flex-1 text-center min-w-0">
        <div className="text-2xl lg:text-lg xl:text-xl font-bold truncate">{revoked}</div>
        <div className="text-xs lg:text-[9px] xl:text-[10px] uppercase truncate">Revoked</div>
      </div>
    </div>
  );
}
