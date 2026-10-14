import { useEffect, useRef, useState } from 'react';
import { LocateFixed, X } from 'lucide-react';
import { mapService as maps, errorMessage } from '../services';

/** Search-as-you-type place picker. `value` is { address, lat, lng } | null. */
export default function PlaceField({ label, value, onChange, onUseMyLocation, placeholder }) {
  const [ text, setText ] = useState(value?.address || '');
  const [ results, setResults ] = useState([]);
  const [ open, setOpen ] = useState(false);
  const [ busy, setBusy ] = useState(false);
  const [ error, setError ] = useState('');
  const requestId = useRef(0);

  // Keep the text in sync when the parent sets the value (e.g. "use my location").
  useEffect(() => {
    setText(value?.address || '');
  }, [ value?.address ]);

  useEffect(() => {
    const query = text.trim();
    if (!open || query.length < 3 || query === value?.address) {
      setResults([]);
      return undefined;
    }
    const controller = new AbortController();
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setBusy(true);
      setError('');
      try {
        const found = await maps.suggestions(query, controller.signal);
        if (id === requestId.current) setResults(found);
      } catch (err) {
        if (err.code !== 'ERR_CANCELED' && id === requestId.current) setError(errorMessage(err));
      } finally {
        if (id === requestId.current) setBusy(false);
      }
    }, 350); // wait for a pause in typing so we don't hit the search service on every keystroke
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [ text, open, value?.address ]);

  const pick = (place) => {
    onChange({ address: place.label, lat: place.lat, lng: place.lng });
    setText(place.label);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="label" htmlFor={`place-${label}`}>{label}</label>
      <div className="relative">
        <input
          id={`place-${label}`}
          className="field pr-20"
          value={text}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        <div className="absolute inset-y-0 right-1 flex items-center">
          {text && (
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded text-muted transition-transform duration-100 hover:text-ink active:scale-90"
              aria-label={`Clear ${label.toLowerCase()}`}
              onClick={() => {
                setText('');
                onChange(null);
                setResults([]);
              }}
            >
              <X size={18} />
            </button>
          )}
          {onUseMyLocation && (
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded text-cng transition-transform duration-100 hover:text-cng-dark active:scale-90"
              aria-label="Use my current location"
              title="Use my current location"
              onClick={onUseMyLocation}
            >
              <LocateFixed size={20} />
            </button>
          )}
        </div>
      </div>

      {open && (busy || results.length > 0 || error || (text.trim().length >= 3 && !value)) && (
        <ul className="animate-fade-up absolute z-[1000] mt-1 max-h-56 sm:max-h-64 w-full overflow-auto rounded-[10px] border border-line bg-white shadow-xl" role="listbox">
          {busy && <li className="px-3.5 py-3 text-sm text-muted">Searching…</li>}
          {error && <li className="px-3.5 py-3 text-sm text-signal">{error}</li>}
          {!busy && !error && results.length === 0 && <li className="px-3.5 py-3 text-sm text-muted">No places found. Try a landmark or area name.</li>}
          {results.map((r) => (
            <li key={`${r.lat},${r.lng},${r.label}`}>
              <button
                type="button"
                role="option"
                className="block w-full min-h-[44px] px-3.5 py-2.5 text-left text-sm sm:text-base transition-colors duration-150 hover:bg-cng-soft active:bg-cng-soft"
                onMouseDown={() => pick(r)}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
