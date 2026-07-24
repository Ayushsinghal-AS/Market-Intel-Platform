import Modal from "../ui/Modal";
import Icon from "../icons/Icon";
import StatCard from "../StatCard";

export default function SignalModal({ open, onClose, strike, side, leg, onTrack }) {
  if (!leg?.screener) return null;
  const s = leg.screener;

  return (
    <Modal open={open} onClose={onClose} title={`${strike} ${side.toUpperCase()} — ${s.label}`}>
      <p className="text-xs text-ink-muted mb-4">{s.rationale}. Illustrative screener output — not a probability claim or trading advice.</p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard label="Target" value={`₹${s.target}`} tone="good" />
        <StatCard label="Stop-Loss" value={`₹${s.stop_loss}`} tone="critical" />
        <StatCard label="Risk:Reward" value={s.risk_reward} />
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-muted mb-4">
        <Icon name="target" className="w-4 h-4" />
        <span>Suggested horizon: {s.horizon}</span>
      </div>

      <button
        onClick={() => {
          onTrack();
          onClose();
        }}
        className="w-full text-sm px-3 py-2 rounded bg-series-blue-light dark:bg-series-blue-dark text-white"
      >
        Track this idea
      </button>
    </Modal>
  );
}
