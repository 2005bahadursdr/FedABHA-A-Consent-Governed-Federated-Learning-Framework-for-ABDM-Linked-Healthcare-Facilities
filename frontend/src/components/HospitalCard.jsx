export default function HospitalCard({ id, status, dataSize }) {
  return (
    <div className="bg-dark-700 p-4 rounded-lg border border-slate-600 flex justify-between items-center">
      <div>
        <h4 className="font-bold text-slate-200">{id}</h4>
        <p className="text-xs text-slate-400">{dataSize} Patients</p>
      </div>
      <div className="flex items-center text-emerald-400 text-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
        {status}
      </div>
    </div>
  );
}
