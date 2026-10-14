import { Loader2 } from 'lucide-react';

export const Plate = ({ children, className = '' }) => <span className={`plate ${className}`}>{children}</span>;

export const Spinner = ({ label = 'Loading' }) => (
  <div className="flex items-center gap-2 text-muted" role="status">
    <Loader2 className="animate-spin" size={20} /> <span>{label}</span>
  </div>
);

const tones = {
  error: 'border-signal/40 bg-signal/10 text-signal animate-shake',
  info: 'border-cng/30 bg-cng-soft text-cng-dark animate-fade-up',
};
export const Notice = ({ tone = 'error', children }) =>
  children ? <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-[10px] border px-3.5 py-2.5 text-[15px] font-medium ${tones[ tone ]}`}>{children}</p> : null;

const statusStyles = {
  pending: 'bg-peeli/30 text-ink',
  accepted: 'bg-cng-soft text-cng-dark',
  ongoing: 'bg-cng text-white',
  completed: 'bg-ink text-white',
  cancelled: 'bg-signal/10 text-signal',
};
export const StatusChip = ({ status }) => <span className={`chip capitalize ${statusStyles[ status ]}`}>{status}</span>;

export const PageSpinner = () => <div className="grid min-h-screen place-items-center"><Spinner /></div>;
