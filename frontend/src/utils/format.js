const rupee = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const money = (n) => rupee.format(n || 0);
export const km = (meters) => `${(meters / 1000).toFixed(1)} km`;
export const minutes = (seconds) => `${Math.max(1, Math.round(seconds / 60))} min`;
export const shortDate = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
export const fullName = (p) => [ p?.fullname?.firstname, p?.fullname?.lastname ].filter(Boolean).join(' ');

export const VEHICLES = {
  moto: { label: 'Bike taxi', blurb: 'Fastest through traffic', seats: 1 },
  auto: { label: 'Auto', blurb: 'Affordable for short trips', seats: 3 },
  car: { label: 'Car', blurb: 'AC and room for four', seats: 4 },
};
