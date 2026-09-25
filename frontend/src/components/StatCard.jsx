export default function StatCard({ title, value, subtitle, icon: Icon, color = 'text-primary-500' }) {
  return (
    <div className="bg-dark-800 border border-slate-700 rounded-xl p-4 sm:p-6 lg:p-4 xl:p-6 flex items-start shadow-md hover:border-slate-500 transition-colors">
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-sm lg:text-xs xl:text-sm font-medium text-slate-400 mb-1 truncate">{title}</p>
        <h3 className="text-2xl sm:text-3xl lg:text-xl xl:text-2xl font-bold text-slate-100 truncate">{value}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1 sm:mt-2 truncate">{subtitle}</p>}
      </div>
      <div className={`p-2 sm:p-3 lg:p-2 xl:p-3 rounded-lg bg-dark-700 shrink-0 ${color}`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-4 lg:h-4 xl:w-5 xl:h-5" />
      </div>
    </div>
  );
}
