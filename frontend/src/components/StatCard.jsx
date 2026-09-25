export default function StatCard({ title, value, subtitle, icon: Icon, color = 'text-primary-500' }) {
  return (
    <div className="bg-dark-800 border border-slate-700 rounded-xl p-6 flex items-start shadow-md hover:border-slate-500 transition-colors">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-100">{value}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg bg-dark-700 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
