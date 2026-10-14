import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import MapView from '../../components/MapView';
import EarningsChart from '../../components/EarningsChart';
import { Notice, Plate, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import useGeolocation from '../../hooks/useGeolocation';
import { captainService as captainApi, rideService as rides, errorMessage } from '../../services';
import { distanceMeters, fromGeoJson } from '../../utils/geo';
import { fullName, km, money, VEHICLES } from '../../utils/format';

const REQUEST_TTL_MS = 5 * 60 * 1000;
const LOCATION_INTERVAL_MS = 8000;

export default function Dashboard() {
  const { account, setAccount } = useAuth();
  const online = account.status === 'active';

  const [ offers, setOffers ] = useState([]);
  const [ ride, setRide ] = useState(null);
  const [ stats, setStats ] = useState(null);
  const [ now, setNow ] = useState(Date.now());
  const [ otp, setOtp ] = useState('');
  const [ riderPaid, setRiderPaid ] = useState(false);
  const [ busy, setBusy ] = useState(false);
  const [ error, setError ] = useState('');
  const [ notice, setNotice ] = useState('');
  const [ expandMap, setExpandMap ] = useState(false);

  // Location is needed while online (for matching) and while on a ride.
  const { position, error: geoError } = useGeolocation(online || Boolean(ride));
  const positionRef = useRef(null);
  useEffect(() => { positionRef.current = position; }, [ position ]);

  const loadStats = useCallback(() => captainApi.stats().then(setStats).catch((err) => setError(errorMessage(err))), []);
  const loadActive = useCallback(async () => {
    const { ride: active } = await rides.active();
    setRide(active);
    setRiderPaid(active?.paymentStatus === 'paid');
  }, []);

  useEffect(() => {
    loadStats();
    loadActive().catch((err) => setError(errorMessage(err)));
  }, [ loadStats, loadActive ]);

  // Hide expired requests without waiting for the server.
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(t); }, []);

  // While online: send the position now and then every few seconds. The server uses it to match rides
  // and, during a ride, forwards it to the rider.
  const hasFix = Boolean(position);
  useEffect(() => {
    if (!online || !hasFix) return undefined;
    const send = () => positionRef.current && captainApi.updateLocation(positionRef.current.lat, positionRef.current.lng).catch(() => {});
    send();
    const timer = setInterval(send, LOCATION_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [ online, hasFix ]);

  // Requests that arrived while this tab was closed: fetch once after the first position is stored.
  useEffect(() => {
    if (!online || !hasFix || ride) return undefined;
    let current = true;
    const timer = setTimeout(() => {
      rides.nearby().then(({ rides: found }) => current && setOffers(found)).catch((err) => current && setError(errorMessage(err)));
    }, 1200);
    return () => { current = false; clearTimeout(timer); };
  }, [ online, hasFix, ride ]);

  useSocket(account ? `captain:${account._id}` : null, {
    'new-ride': (incoming) => setOffers((list) => (list.some((r) => r._id === incoming._id) ? list : [ incoming, ...list ])),
    'ride-cancelled': ({ rideId }) => {
      setOffers((list) => list.filter((r) => r._id !== rideId));
      setRide((current) => {
        if (current?._id === rideId) { setNotice('The rider cancelled this ride.'); return null; }
        return current;
      });
    },
    'payment-received': () => setRiderPaid(true),
  });

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try { await fn(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  const toggleOnline = () => run(async () => {
    setNotice('');
    const { captain } = await captainApi.setStatus(online ? 'inactive' : 'active');
    setAccount(captain);
    if (online) setOffers([]);
  });

  const accept = (offer) => run(async () => {
    try {
      const { ride: accepted } = await rides.accept(offer._id);
      setRide(accepted);
      setRiderPaid(false);
      setOffers([]);
      setOtp('');
      setNotice('');
    } catch (err) {
      if (err.response?.status === 409) {
        setOffers((list) => list.filter((r) => r._id !== offer._id));
        setNotice('Another captain took that ride, or the rider cancelled.');
      } else throw err;
    }
  });

  const start = (e) => {
    e.preventDefault();
    run(async () => { const { ride: started } = await rides.start(ride._id, otp); setRide(started); });
  };

  const end = () => run(async () => {
    const { ride: done } = await rides.end(ride._id);
    setRide(null);
    setNotice(`Ride complete. You earned ${money(done.fare)}.`);
    loadStats();
  });

  // ---- map ---------------------------------------------------------
  const markers = [];
  if (position) markers.push({ id: 'me', kind: ride ? 'captain' : 'me', position });
  if (ride) {
    markers.push({ id: 'pickup', kind: 'pickup', position: fromGeoJson(ride.pickup.location) });
    if (ride.status === 'ongoing') markers.push({ id: 'destination', kind: 'destination', position: fromGeoJson(ride.destination.location) });
  } else {
    offers.forEach((o) => markers.push({ id: o._id, kind: 'pickup', position: fromGeoJson(o.pickup.location) }));
  }

  const liveOffers = offers.filter((o) => new Date(o.createdAt).getTime() + REQUEST_TTL_MS > now);
  const vehicle = account.vehicle;

  return (
    <div className="flex h-full flex-col lg:grid lg:grid-cols-[440px_1fr]">
      <section
        className={`order-2 border-r border-line bg-white p-4 sm:p-5 lg:order-1 lg:flex-1 lg:overflow-y-auto ${
          expandMap ? 'max-h-[38%] shrink-0 overflow-y-auto shadow-md lg:max-h-full' : 'flex-1 overflow-y-auto space-y-4 sm:space-y-5'
        }`}
        aria-live="polite"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{online ? 'You are online' : 'You are offline'}</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted capitalize">{vehicle.color} {VEHICLES[ vehicle.vehicleType ]?.label.toLowerCase()}</p>
          </div>
          <Plate className="text-base sm:text-lg">{vehicle.plate.toUpperCase()}</Plate>
        </div>

        {!ride && (
          <button className={`btn w-full ${online ? 'btn-ghost' : 'btn-green'}`} disabled={busy} onClick={toggleOnline}>
            {online ? 'Go offline' : 'Go online to get ride requests'}
          </button>
        )}
        {online && geoError && <Notice>{geoError}</Notice>}
        {online && !position && !geoError && <Spinner label="Getting your location" />}

        {ride ? (
          <ActiveRide ride={ride} otp={otp} setOtp={setOtp} onStart={start} onEnd={end} busy={busy} riderPaid={riderPaid} />
        ) : online ? (
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Ride requests</h2>
            {liveOffers.length === 0 ? (
              <p className="mt-2 rounded-[10px] bg-mist p-3.5 sm:p-4 text-xs sm:text-sm text-muted">No requests near you right now. New ones appear here automatically.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line rounded-[10px] border border-line">
                {liveOffers.map((offer) => (
                  <li key={offer._id} className="space-y-1 p-3.5 sm:p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold truncate text-sm sm:text-base">{fullName(offer.user)}</p>
                      <p className="font-display text-lg sm:text-xl font-bold shrink-0">{money(offer.fare)}</p>
                    </div>
                    <p className="text-xs sm:text-sm truncate">{offer.pickup.address}</p>
                    <p className="text-xs sm:text-sm text-muted truncate">to {offer.destination.address}</p>
                    <p className="text-xs text-muted">
                      {position && `${km(distanceMeters(position, fromGeoJson(offer.pickup.location)))} from you · `}trip {km(offer.distance)}
                    </p>
                    <button className="btn btn-primary mt-2 w-full" disabled={busy} onClick={() => accept(offer)}>Accept ride</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        <Notice>{error}</Notice>
        <Notice tone="info">{notice}</Notice>

        <div className="space-y-4 border-t border-line pt-4 sm:pt-5">
          <h2 className="text-lg sm:text-xl font-bold">Your earnings</h2>
          {!stats ? <Spinner /> : (
            <>
              <dl className="grid grid-cols-2 gap-3 sm:gap-4">
                <div><dt className="text-xs sm:text-sm text-muted">Today</dt><dd className="font-display text-2xl sm:text-3xl font-bold">{money(stats.today.earnings)}</dd><dd className="text-xs sm:text-sm text-muted">{stats.today.rides} {stats.today.rides === 1 ? 'ride' : 'rides'}</dd></div>
                <div><dt className="text-xs sm:text-sm text-muted">All time</dt><dd className="font-display text-2xl sm:text-3xl font-bold">{money(stats.total.earnings)}</dd><dd className="text-xs sm:text-sm text-muted">{stats.total.rides} {stats.total.rides === 1 ? 'ride' : 'rides'} · {stats.total.distanceKm} km</dd></div>
              </dl>
              <EarningsChart daily={stats.daily} />
            </>
          )}
        </div>
      </section>

      <section
        className={`order-1 relative shrink-0 lg:order-2 lg:h-full lg:min-h-0 lg:shrink ${
          expandMap ? 'flex-1 h-full' : 'h-[36vh] min-h-[220px]'
        }`}
        aria-label="Map"
      >
        <button
          type="button"
          className="absolute right-3 top-3 z-[400] flex items-center gap-1.5 rounded-full border border-line bg-white/95 px-3 py-1.5 text-xs font-bold text-ink shadow-md backdrop-blur active:scale-95 transition-transform lg:hidden"
          onClick={() => setExpandMap((v) => !v)}
          aria-label={expandMap ? 'Show captain panel' : 'Expand map full screen'}
        >
          {expandMap ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          <span>{expandMap ? 'Details' : 'Map'}</span>
        </button>
        <MapView markers={markers} focus={position} />
      </section>
    </div>
  );
}

function ActiveRide({ ride, otp, setOtp, onStart, onEnd, busy, riderPaid }) {
  const riderName = fullName(ride.user);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{ride.status === 'accepted' ? `Pick up ${riderName}` : `Drop ${riderName}`}</h2>
      <dl className="space-y-2 border-y border-line py-3">
        <div><dt className="text-sm text-muted">Pickup</dt><dd className="font-semibold">{ride.pickup.address}</dd></div>
        <div><dt className="text-sm text-muted">Drop</dt><dd className="font-semibold">{ride.destination.address}</dd></div>
      </dl>
      <p className="font-display text-3xl font-bold">{money(ride.fare)} <span className="text-base font-normal text-muted">cash</span></p>

      {ride.status === 'accepted' ? (
        <form onSubmit={onStart} className="space-y-3">
          <label className="label" htmlFor="otp">Ask the rider for their 6-digit code</label>
          <input id="otp" className="field text-center font-display text-2xl font-bold tracking-[0.4em]" inputMode="numeric" maxLength={6} value={otp} autoComplete="one-time-code"
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
          <button className="btn btn-primary w-full" disabled={busy || otp.length !== 6}>Start ride</button>
        </form>
      ) : (
        <div className="space-y-3">
          {riderPaid && <Notice tone="info">The rider says they paid {money(ride.fare)} in cash. Check you have it, then end the ride.</Notice>}
          <button className="btn btn-green w-full" disabled={busy} onClick={onEnd}>End ride</button>
        </div>
      )}
    </div>
  );
}
