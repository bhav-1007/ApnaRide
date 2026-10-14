import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { rideService as rides, errorMessage } from '../services';
import { Notice, Spinner, StatusChip } from '../components/ui';
import { fullName, km, money, shortDate } from '../utils/format';

const FILTERS = [ [ '', 'All' ], [ 'completed', 'Completed' ], [ 'cancelled', 'Cancelled' ] ];

export default function History({ role }) {
  const [ page, setPage ] = useState(1);
  const [ status, setStatus ] = useState('');
  const [ data, setData ] = useState(null);
  const [ error, setError ] = useState('');

  useEffect(() => {
    let current = true;
    setData(null);
    setError('');
    rides.history({ page, limit: 8, ...(status && { status }) })
      .then((res) => current && setData(res))
      .catch((err) => current && setError(errorMessage(err)));
    return () => { current = false; };
  }, [ page, status ]);

  const other = (ride) => (role === 'user' ? ride.captain : ride.user);

  return (
    <div className="mx-auto h-full max-w-3xl overflow-auto p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl sm:text-4xl font-extrabold">Ride history</h1>
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0" role="group" aria-label="Filter by status">
          {FILTERS.map(([ value, label ]) => (
            <button
              key={label}
              aria-pressed={status === value}
              onClick={() => { setStatus(value); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-sm sm:text-base font-semibold shrink-0 transition-colors duration-150 ${
                status === value ? 'bg-ink text-white' : 'bg-white text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 sm:mt-5">
        <Notice>{error}</Notice>
        {!data && !error && <Spinner />}
        {data && data.rides.length === 0 && (
          <p className="rounded-[10px] bg-white p-5 sm:p-6 text-sm sm:text-base text-muted">
            {status ? `No ${status} rides yet.` : role === 'user' ? 'You have not taken a ride yet. Book one from the Book a ride tab.' : 'No rides yet. Go online from the Drive tab to receive requests.'}
          </p>
        )}
        {data && data.rides.length > 0 && (
          <ul className="divide-y divide-line rounded-[10px] bg-white shadow-sm">
            {data.rides.map((ride) => (
              <li key={ride._id} className="flex flex-wrap items-start justify-between gap-3 px-3.5 py-3 sm:px-4 sm:py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-sm sm:text-base">{ride.pickup.address}</p>
                  <p className="truncate text-xs sm:text-sm text-muted">to {ride.destination.address}</p>
                  <p className="mt-1 text-xs sm:text-sm text-muted">
                    {shortDate(ride.createdAt)} · {km(ride.distance)} · {ride.vehicleType}
                    {other(ride) && ` · ${role === 'user' ? 'Captain' : 'Rider'} ${fullName(other(ride))}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-lg sm:text-xl font-bold">{money(ride.fare)}</p>
                  <StatusChip status={ride.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between gap-2" aria-label="Pagination">
          <button className="btn btn-ghost min-h-[44px] px-3 text-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft size={16} /> Newer
          </button>
          <span className="text-xs sm:text-sm text-muted">Page {data.page} of {data.totalPages}</span>
          <button className="btn btn-ghost min-h-[44px] px-3 text-sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Older <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
