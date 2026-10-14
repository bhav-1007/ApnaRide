import { useEffect, useState } from 'react';

/** Watches the device position while `enabled`. Returns { position: {lat,lng}|null, error: string|null }. */
export default function useGeolocation(enabled = true) {
  const [ position, setPosition ] = useState(null);
  const [ error, setError ] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    if (!navigator.geolocation) {
      setError('This browser cannot share your location.');
      return undefined;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => { setError(null); setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      (err) => setError(err.code === 1 ? 'Location is blocked. Allow location access in your browser settings.' : 'Could not get your location.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [ enabled ]);

  return { position, error };
}
