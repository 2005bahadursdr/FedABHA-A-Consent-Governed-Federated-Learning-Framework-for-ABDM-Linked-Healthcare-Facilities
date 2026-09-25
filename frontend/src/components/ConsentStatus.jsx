export default function ConsentStatus({ approved, blocked, revoked }) {
  return (
    <div className="flex gap-4">
      <div className="bg-blue-400/10 text-blue-400 p-4 rounded-lg flex-1 text-center">
        <div className="text-2xl font-bold">{approved}</div>
        <div className="text-xs uppercase">Approved</div>
      </div>
      <div className="bg-rose-400/10 text-rose-400 p-4 rounded-lg flex-1 text-center">
        <div className="text-2xl font-bold">{blocked}</div>
        <div className="text-xs uppercase">Blocked</div>
      </div>
      <div className="bg-slate-400/10 text-slate-400 p-4 rounded-lg flex-1 text-center">
        <div className="text-2xl font-bold">{revoked}</div>
        <div className="text-xs uppercase">Revoked</div>
      </div>
    </div>
  );
}
