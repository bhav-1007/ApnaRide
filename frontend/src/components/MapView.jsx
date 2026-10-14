import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const icons = {};
const iconFor = (kind) => {
  icons[ kind ] ||= L.divIcon({ className: '', html: `<div class="pin pin-${kind}"></div>`, iconSize: [ 22, 22 ], iconAnchor: [ 11, 11 ] });
  return icons[ kind ];
};

const INDIA = [ 22.5, 79 ];

function FitToContent({ points, focus }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points.map((p) => [ p.lat, p.lng ])), { padding: [ 48, 48 ], maxZoom: 16 });
    } else if (points.length === 1) {
      map.setView([ points[ 0 ].lat, points[ 0 ].lng ], 15);
    } else if (focus) {
      map.setView([ focus.lat, focus.lng ], 15);
    }
    // Re-fit only when the set of points changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ map, points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|'), focus?.lat, focus?.lng ]);
  return null;
}

/**
 * markers: [{ id, kind: 'pickup'|'destination'|'captain'|'me', position: {lat,lng} }]
 * route: GeoJSON LineString ({ coordinates: [[lng,lat],...] }) or null
 * The camera frames every marker except 'me'; with none, it centres on `focus`.
 */
export default function MapView({ markers = [], route = null, focus = null, className = '' }) {
  const points = markers.filter((m) => m.kind !== 'me').map((m) => m.position);

  return (
    <MapContainer center={INDIA} zoom={5} className={`h-full w-full ${className}`} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />
      {route && (
        <Polyline positions={route.coordinates.map(([ lng, lat ]) => [ lat, lng ])} pathOptions={{ color: '#0B6B47', weight: 5, opacity: 0.9 }} />
      )}
      {markers.map((m) => <Marker key={m.id} position={[ m.position.lat, m.position.lng ]} icon={iconFor(m.kind)} />)}
      <FitToContent points={points} focus={focus} />
    </MapContainer>
  );
}
