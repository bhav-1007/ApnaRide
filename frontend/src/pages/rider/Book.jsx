import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Maximize2, Minimize2 } from 'lucide-react';
import MapView from '../../components/MapView';
import PlaceField from '../../components/PlaceField';
import { Notice, Plate, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import useGeolocation from '../../hooks/useGeolocation';
import { mapService as maps, rideService as rides, errorMessage } from '../../services';
import { fromGeoJson, placeFromRide } from '../../utils/geo';
import { fullName, km, minutes, money, VEHICLES } from '../../utils/format';

const REQUEST_TTL_MS = 5 * 60 * 1000; // keep in sync with DISPATCH.REQUEST_TTL_MS on the server

export default function Book() {
  const { account } = useAuth();
  const [ ride, setRide ] = useState(null);          // the rider's live ride, straight from the server
  const [ finished, setFinished ] = useState(null);  // the ride that just ended (receipt)
  const [ loaded, setLoaded ] = useState(false);
  const [ notice, setNotice ] = useState('');
  const [ error, setError ] = useState('');

  const [ pickup, setPickup ] = useState(null);
  const [ destination, setDestination ] = useState(null);
  const [ quote, setQuote ] = useState(null);
  const [ quoting, setQuoting ] = useState(false);
  const [ vehicleType, setVehicleType ] = useState('auto');
  const [ busy, setBusy ] = useState(false);
  const [ captainPos, setCaptainPos ] = useState(null);
  const [ expandMap, setExpandMap ] = useState(false);

  const { position: myPosition, error: geoError } = useGeolocation(true);
  const previousStatus = useRef(null);

  // The server is the source of truth. Pushed events just tell us when to look again.
  const refresh = useCallback(async () => {
    try {
      const { ride: active } = await rides.active();
      if (previousStatus.current === 'pending' && !active) {
        setNotice('No captain accepted your request in time. Try booking again.');
      }
      previousStatus.current = active?.status || null;
      setRide(active);
      if (active?.captain?.location) setCaptainPos((p) => p || fromGeoJson(active.captain.location));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [ refresh ]);

  // Pushes can be missed while a tab sleeps, so re-check when the tab becomes visible again.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [ refresh ]);

  useSocket(account ? `user:${account._id}` : null, {
    'ride-accepted': refresh,
    'ride-started': refresh,
    'ride-ended': (ended) => { previousStatus.current = null; setRide(null); setFinished(ended); setCaptainPos(null); },
    'ride-cancelled': refresh,
  });

  // Live captain position while a captain is assigned.
  const tracking = ride && (ride.status === 'accepted' || ride.status === 'ongoing');
  useSocket(tracking ? `ride:${ride._id}` : null, {
    'captain-location': ({ lat, lng }) => setCaptainPos({ lat, lng }),
  });

  // A pending request expires on the server after 5 minutes; check again when that time passes.
  useEffect(() => {
    if (ride?.status !== 'pending') return undefined;
    const wait = new Date(ride.createdAt).getTime() + REQUEST_TTL_MS - Date.now() + 1500;
    const timer = setTimeout(refresh, Math.max(wait, 1000));
    return () => clearTimeout(timer);
  }, [ ride?.status, ride?.createdAt, refresh ]);

  // Fare quote whenever both places are chosen.
  useEffect(() => {
    if (ride || !pickup || !destination) { setQuote(null); return undefined; }
    let current = true;
    setQuoting(true);
    setError('');
    rides.quote(pickup, destination)
      .then((q) => current && setQuote(q))
      .catch((err) => { if (current) { setQuote(null); setError(errorMessage(err)); } })
      .finally(() => current && setQuoting(false));
    return () => { current = false; };
  }, [ pickup, destination, ride ]);

  // After a page refresh a live ride has no route in memory, so fetch it again.
  const [ rideRoute, setRideRoute ] = useState(null);
  useEffect(() => {
    if (!ride) { setRideRoute(null); return undefined; }
    let current = true;
    rides.quote(placeFromRide(ride.pickup), placeFromRide(ride.destination))
      .then((q) => current && setRideRoute(q.route)).catch(() => {});
    return () => { current = false; };
  }, [ ride?._id ]); // eslint-disable-line react-hooks/exhaustive-deps

  const useMyLocation = async () => {
    if (!myPosition) { setError(geoError || 'Waiting for your location. Try again in a moment.'); return; }
    setError('');
    try {
      const place = await maps.reverse(myPosition.lat, myPosition.lng);
      setPickup({ address: place.label, lat: myPosition.lat, lng: myPosition.lng });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const book = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await rides.create({ pickup, destination, vehicleType });
      previousStatus.current = 'pending';
      setRide(result.ride);
      setFinished(null);
      if (result.captainsNotified === 0) setNotice('No captains are online near your pickup right now. We will keep your request open for 5 minutes.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const act = (fn, after) => async () => {
    setBusy(true);
    setError('');
    try { await fn(); await after?.(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  const cancel = act(() => rides.cancel(ride._id), async () => { previousStatus.current = null; setRide(null); setNotice('Ride cancelled.'); });
  const pay = act(() => rides.pay(ride._id), refresh);

  const clearTrip = () => { setFinished(null); setPickup(null); setDestination(null); setQuote(null); setNotice(''); };

  // ---- map content -------------------------------------------------
  const markers = [];
  const shown = ride ? { p: fromGeoJson(ride.pickup.location), d: fromGeoJson(ride.destination.location) } : { p: pickup, d: destination };
  if (shown.p) markers.push({ id: 'pickup', kind: 'pickup', position: shown.p });
  if (shown.d) markers.push({ id: 'destination', kind: 'destination', position: shown.d });
  if (captainPos && tracking) markers.push({ id: 'captain', kind: 'captain', position: captainPos });
  if (myPosition && !ride) markers.push({ id: 'me', kind: 'me', position: myPosition });

  if (!loaded) return <div className="grid h-full place-items-center p-10"><Spinner label="Checking for an active ride" /></div>;

  return (
    <div className="flex h-full flex-col lg:grid lg:grid-cols-[440px_1fr]">
      <section
        className={`order-2 border-r border-line bg-white p-4 sm:p-5 lg:order-1 lg:flex-1 lg:overflow-y-auto ${
          expandMap ? 'max-h-[38%] shrink-0 overflow-y-auto shadow-md lg:max-h-full' : 'flex-1 overflow-y-auto'
        }`}
        aria-live="polite"
      >
        {finished ? (
          <Receipt ride={finished} onDone={clearTrip} />
        ) : ride ? (
          <ActiveRide ride={ride} busy={busy} onCancel={cancel} onPay={pay} />
        ) : (
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold">Where to?</h1>
            <PlaceField label="Pickup" value={pickup} onChange={setPickup} onUseMyLocation={useMyLocation} placeholder="Search a place or use your location" />
            <PlaceField label="Drop" value={destination} onChange={setDestination} placeholder="Where are you going?" />

            {quoting && <Spinner label="Finding the route" />}
            {quote && (
              <div className="animate-fade-up">
                <p className="mb-2 text-xs sm:text-sm text-muted">{km(quote.distance)} · about {minutes(quote.duration)}</p>
                <div role="radiogroup" aria-label="Vehicle type" className="divide-y divide-line overflow-hidden rounded-[10px] border border-line">
                  {Object.entries(VEHICLES).map(([ key, v ]) => (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-3 transition-colors duration-150 active:scale-[0.99] ${vehicleType === key ? 'bg-cng-soft' : 'hover:bg-mist'}`}
                    >
                      <span className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <input type="radio" name="vehicle" className="h-4 w-4 shrink-0 accent-cng" checked={vehicleType === key} onChange={() => setVehicleType(key)} />
                        <span className="min-w-0">
                          <span className="block font-semibold truncate text-sm sm:text-base">{v.label}</span>
                          <span className="block text-xs sm:text-sm text-muted truncate">{v.blurb} · {v.seats} {v.seats === 1 ? 'seat' : 'seats'}</span>
                        </span>
                      </span>
                      <span className="font-display text-lg sm:text-xl font-bold shrink-0">{money(quote.fares[ key ])}</span>
                    </label>
                  ))}
                </div>
                <button className="btn btn-primary mt-4 w-full" disabled={busy} onClick={book}>
                  {busy ? 'Booking…' : `Book ${VEHICLES[ vehicleType ].label.toLowerCase()} for ${money(quote.fares[ vehicleType ])}`}
                </button>
                <p className="mt-2 text-xs sm:text-sm text-muted">You pay the captain in cash at the end of the ride.</p>
              </div>
            )}
          </div>
        )}
        <div className="mt-4 space-y-2">
          <Notice>{error}</Notice>
          <Notice tone="info">{notice}</Notice>
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
          aria-label={expandMap ? 'Show ride details' : 'Expand map full screen'}
        >
          {expandMap ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          <span>{expandMap ? 'Details' : 'Map'}</span>
        </button>
        <MapView markers={markers} route={ride ? rideRoute : quote?.route} focus={myPosition} />
      </section>
    </div>
  );
}

function Countdown({ since }) {
  const [ now, setNow ] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, Math.round((new Date(since).getTime() + REQUEST_TTL_MS - now) / 1000));
  return <span>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>;
}

function Route({ ride }) {
  return (
    <dl className="space-y-2 border-y border-line py-3">
      <div><dt className="text-sm text-muted">Pickup</dt><dd className="font-semibold">{ride.pickup.address}</dd></div>
      <div><dt className="text-sm text-muted">Drop</dt><dd className="font-semibold">{ride.destination.address}</dd></div>
    </dl>
  );
}

function CaptainCard({ captain }) {
  if (!captain) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-lg font-bold">{fullName(captain)}</p>
        <p className="text-muted capitalize">{captain.vehicle.color} {VEHICLES[ captain.vehicle.vehicleType ]?.label.toLowerCase()}</p>
      </div>
      <Plate className="text-lg">{captain.vehicle.plate.toUpperCase()}</Plate>
    </div>
  );
}

function ActiveRide({ ride, busy, onCancel, onPay }) {
  if (ride.status === 'pending') {
    return (
      <div className="space-y-4 animate-fade-up">
        <h1 className="text-3xl font-extrabold">Finding a captain</h1>
        <div className="flex items-center gap-3 rounded-[10px] border border-cng/20 bg-cng-soft/50 p-3">
          <div className="relative flex h-8 w-8 items-center justify-center shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-cng/25 animate-radar" />
            <span className="relative flex h-2.5 w-2.5 rounded-full bg-cng" />
          </div>
          <div>
            <p className="font-semibold text-ink">Asking nearby captains…</p>
            <p className="text-xs text-muted">Your request stays open for <Countdown since={ride.createdAt} /></p>
          </div>
        </div>
        <Route ride={ride} />
        <p className="font-display text-2xl font-bold">{money(ride.fare)} <span className="text-base font-normal text-muted">· {VEHICLES[ ride.vehicleType ].label}</span></p>
        <button className="btn btn-danger w-full" disabled={busy} onClick={onCancel}>Cancel request</button>
      </div>
    );
  }

  if (ride.status === 'accepted') {
    return (
      <div className="space-y-4 animate-fade-up">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-cng animate-pulse" />
          <h1 className="text-3xl font-extrabold">Captain is on the way</h1>
        </div>
        <CaptainCard captain={ride.captain} />
        <div>
          <p className="text-muted">Tell your captain this code to start the ride</p>
          <div className="mt-1 flex gap-1.5" aria-label={`Ride code ${ride.otp}`}>
            {ride.otp.split('').map((digit, i) => (
              <Plate key={i} className="px-3.5 py-2 text-3xl shadow-sm transition-transform duration-150 hover:-translate-y-0.5">
                {digit}
              </Plate>
            ))}
          </div>
        </div>
        <Route ride={ride} />
        <p className="font-display text-2xl font-bold">{money(ride.fare)}</p>
        <button className="btn btn-danger w-full" disabled={busy} onClick={onCancel}>Cancel ride</button>
      </div>
    );
  }

  // ongoing
  return (
    <div className="space-y-4 animate-fade-up">
      <h1 className="text-3xl font-extrabold">You are on your ride</h1>
      <CaptainCard captain={ride.captain} />
      <Route ride={ride} />
      <p className="font-display text-3xl font-bold">{money(ride.fare)}</p>
      {ride.paymentStatus === 'paid' ? (
        <p className="flex items-center gap-2 font-semibold text-cng animate-pop">
          <CheckCircle2 size={20} className="shrink-0" />
          You confirmed the cash payment. The captain will end the ride.
        </p>
      ) : (
        <button className="btn btn-green w-full" disabled={busy} onClick={onPay}>
          I paid {money(ride.fare)} in cash
        </button>
      )}
    </div>
  );
}

function Receipt({ ride, onDone }) {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={26} className="text-cng animate-pop" />
        <h1 className="text-3xl font-extrabold">You have arrived</h1>
      </div>
      <Route ride={ride} />
      <p className="text-muted">{km(ride.distance)} · {VEHICLES[ ride.vehicleType ].label}</p>
      <p className="font-display text-4xl font-bold">{money(ride.fare)}</p>
      <p className="text-muted">{ride.paymentStatus === 'paid' ? 'Paid in cash.' : 'Pay your captain in cash.'}</p>
      <button className="btn btn-primary w-full" onClick={onDone}>Book another ride</button>
    </div>
  );
}
