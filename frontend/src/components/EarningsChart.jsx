import { money } from '../utils/format';

const dayKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);

/** Last `days` days of earnings. Days with no rides are filled in as zero so the axis is continuous. */
export default function EarningsChart({ daily, days = 7 }) {
  const byDate = Object.fromEntries(daily.map((d) => [ d.date, d ]));
  const series = Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 86400000);
    const key = dayKey(date);
    return {
      key,
      label: date.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
      ...(byDate[ key ] || { rides: 0, earnings: 0 }),
    };
  });
  const max = Math.max(...series.map((d) => d.earnings), 1);
  const total = series.reduce((sum, d) => sum + d.earnings, 0);

  return (
    <figure>
      <figcaption className="mb-2 flex items-baseline justify-between">
        <span className="font-semibold">Last {days} days</span>
        <span className="text-muted">{money(total)}</span>
      </figcaption>
      <div className="flex h-28 items-end gap-2" role="img" aria-label={`Earnings over the last ${days} days: ${money(total)} in total`}>
        {series.map((d, i) => (
          <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${d.key}: ${money(d.earnings)}, ${d.rides} rides`}>
            <div
              className={`w-full rounded-t ${i === series.length - 1 ? 'bg-peeli' : 'bg-cng'}`}
              style={{
                height: `${Math.max((d.earnings / max) * 100, d.earnings ? 6 : 2)}%`,
                opacity: d.earnings ? 1 : 0.25,
              }}
            />
            <span className="text-xs text-muted">{d.label}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}
