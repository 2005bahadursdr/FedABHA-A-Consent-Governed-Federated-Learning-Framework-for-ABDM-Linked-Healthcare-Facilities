export default function FLProgress({ round, accuracy }) {
  // Cap width at 100% or scale dynamically if round > 10
  const maxRound = Math.max(10, round);
  const progressPercent = (round / maxRound) * 100;

  return (
    <div className="p-4 bg-primary-900/30 border border-primary-500/30 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-primary-300 font-semibold">Global Round {round}</span>
        <span className="text-emerald-400 font-bold">{Number(accuracy).toFixed(2)}% Acc</span>
      </div>
      <div className="w-full bg-dark-800 rounded-full h-2 overflow-hidden">
        <div className="h-2 rounded-full bg-primary-500" style={{ width: `${progressPercent}%` }}></div>
      </div>
    </div>
  );
}
