import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  ShieldCheck,
  Zap,
  ArrowRight,
  ChevronDown,
  Star,
  CheckCircle2,
  MapPin,
  TrendingUp,
  Wallet,
  Compass,
} from 'lucide-react';
import { Brand } from '../layouts/Shell';
import { Plate } from '../components/ui';
import { money } from '../utils/format';

// Popular sample city routes for instant estimation demo
const POPULAR_ROUTES = [
  { pickup: 'Koramangala 5th Block', drop: 'Indiranagar 100ft Road', distanceKm: 6.4, mins: 18 },
  { pickup: 'MG Road Metro Station', drop: 'HSR Layout Sector 1', distanceKm: 8.8, mins: 24 },
  { pickup: 'Whitefield ITPL', drop: 'Electronic City Phase 1', distanceKm: 26.5, mins: 52 },
];

const FLEET = [
  {
    id: 'auto',
    name: 'Apna Auto',
    category: 'CNG Auto',
    seats: 3,
    base: 30,
    perKm: 12,
    badge: 'Zero Surge Guarantee',
    description: 'The iconic city mover. Direct metered fares with zero unexpected surge multipliers.',
    features: ['Direct cash or UPI', 'Fits through city traffic', '3 passengers + grocery storage'],
  },
  {
    id: 'cab',
    name: 'Apna Cab',
    category: 'Sedan / Hatchback AC',
    seats: 4,
    base: 50,
    perKm: 18,
    badge: 'AC Comfort',
    description: 'Climate-controlled, quiet rides for family trips, office commutes, or airport drops.',
    features: ['Spacious boot for luggage', 'Verified background-checked drivers', 'Sanitized interiors'],
  },
  {
    id: 'moto',
    name: 'Apna Moto',
    category: 'Bike Taxi',
    seats: 1,
    base: 15,
    perKm: 8,
    badge: 'Fastest in Traffic',
    description: 'Zip through rush-hour bottlenecks. The most affordable, rapid solo commute in town.',
    features: ['Sanitized helmet provided', 'Fastest travel time', 'Lowest price per kilometer'],
  },
];

const FAQS = [
  {
    q: 'How does ApnaRide calculate ride fares?',
    a: 'Fares are transparently calculated upfront based on accurate road distance and travel time. You see the exact price before confirming—no hidden surge multipliers or post-trip surprise charges.',
  },
  {
    q: 'How do I pay my captain?',
    a: 'You pay your captain directly at the end of the trip via cash or your preferred UPI app (Google Pay, PhonePe, Paytm). The app does not lock your funds in closed digital wallets.',
  },
  {
    q: 'What safety measures protect riders and captains?',
    a: 'Every ride generates a secure 6-digit start OTP that only the rider sees. Captains must verify vehicle commercial license plates, and your trip progress is streamed live over encrypted WebSockets.',
  },
  {
    q: 'Why do captains prefer driving with ApnaRide?',
    a: 'We operate on fair, transparent models with 0% platform commission cuts on CNG autos and minimal overhead on cabs. Captains keep their hard-earned money and receive instant cash payouts.',
  },
];

export default function Landing() {
  // Hero Estimator State
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [activeVehicle, setActiveVehicle] = useState('auto');

  // Driver Calculator State
  const [dailyRides, setDailyRides] = useState(8);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  const currentRoute = POPULAR_ROUTES[selectedRouteIdx];
  const selectedVehicleObj = FLEET.find((v) => v.id === activeVehicle) || FLEET[0];
  const estimatedFare = Math.round(selectedVehicleObj.base + currentRoute.distanceKm * selectedVehicleObj.perKm);

  // Driver Earnings: ~₹175 avg net earnings per ride * daily rides * 26 working days
  const estimatedMonthlyEarnings = dailyRides * 175 * 26;

  return (
    <div className="min-h-screen bg-mist text-ink">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-line/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Brand />

          <nav className="hidden items-center gap-6 md:flex" aria-label="Quick Navigation">
            <a href="#estimator" className="text-sm font-semibold text-muted transition-colors hover:text-ink">
              Fare Estimator
            </a>
            <a href="#fleet" className="text-sm font-semibold text-muted transition-colors hover:text-ink">
              Fleet Options
            </a>
            <a href="#why-apnaride" className="text-sm font-semibold text-muted transition-colors hover:text-ink">
              Why Us
            </a>
            <a href="#drive" className="text-sm font-semibold text-muted transition-colors hover:text-ink">
              Drive &amp; Earn
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/rider/login" className="btn btn-ghost min-h-[38px] px-3 text-sm">
              Log in
            </Link>
            <Link to="/rider/signup" className="btn btn-primary min-h-[38px] px-3.5 text-sm">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 2. Hero Section with Live Route Estimator */}
        <section id="estimator" className="relative overflow-hidden border-b border-line bg-gradient-to-b from-white to-mist pb-16 pt-10 sm:pt-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Value Proposition */}
              <div className="space-y-6 lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-cng/30 bg-cng-soft px-3.5 py-1 text-xs font-bold text-cng-dark sm:text-sm">
                  <span className="h-2 w-2 rounded-full bg-cng animate-pulse" />
                  India&apos;s Transparent Mobility Network
                </div>

                <h1 className="text-4xl font-extrabold leading-[1.08] sm:text-6xl lg:text-7xl">
                  Apna Shehar, <br />
                  <span className="text-cng">Apni Ride.</span>
                </h1>

                <p className="max-w-xl text-base text-muted sm:text-lg">
                  Transparent upfront pricing, zero gouging, and instant captain dispatch.
                  Book verified CNG Autos, air-conditioned Cabs, or rapid Moto bike taxis in seconds.
                </p>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold sm:text-sm">
                  <div className="flex items-center gap-1.5 text-ink">
                    <CheckCircle2 size={18} className="text-cng" />
                    <span>Upfront transparent fares</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-ink">
                    <ShieldCheck size={18} className="text-cng" />
                    <span>Verified drivers &amp; OTP</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-ink">
                    <Wallet size={18} className="text-cng" />
                    <span>Direct cash / UPI</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link to="/rider/signup" className="btn btn-primary min-h-[48px] px-6 text-base">
                    Book Your First Ride <ArrowRight size={18} />
                  </Link>
                  <Link to="/captain/signup" className="btn btn-ghost min-h-[48px] px-5 text-base">
                    Drive &amp; Keep Fares
                  </Link>
                </div>
              </div>

              {/* Right Column: Interactive Hero Fare Calculator Card */}
              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
                  {/* Card Header */}
                  <div className="border-b border-line bg-mist/60 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">Live Fare Calculator</span>
                      <span className="flex items-center gap-1 rounded-full bg-cng-soft px-2 py-0.5 text-xs font-semibold text-cng-dark">
                        <Zap size={12} /> Instant Quote
                      </span>
                    </div>
                    <p className="mt-1 font-display text-lg font-bold">Try an instant sample ride</p>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Route Selector Pills */}
                    <div>
                      <label className="label text-xs">Select a popular route:</label>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                        {POPULAR_ROUTES.map((route, idx) => (
                          <button
                            key={route.pickup}
                            type="button"
                            onClick={() => setSelectedRouteIdx(idx)}
                            className={`rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors ${selectedRouteIdx === idx
                                ? 'border-cng bg-cng-soft text-cng-dark font-bold'
                                : 'border-line bg-white hover:bg-mist text-muted'
                              }`}
                          >
                            Route #{idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Route Details Box */}
                    <div className="rounded-xl border border-line bg-mist/40 p-3 space-y-2">
                      <div className="flex items-start gap-2 text-xs">
                        <MapPin size={14} className="mt-0.5 shrink-0 text-cng" />
                        <div>
                          <span className="text-muted">Pickup: </span>
                          <span className="font-semibold text-ink">{currentRoute.pickup}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <Compass size={14} className="mt-0.5 shrink-0 text-ink" />
                        <div>
                          <span className="text-muted">Destination: </span>
                          <span className="font-semibold text-ink">{currentRoute.drop}</span>
                        </div>
                      </div>
                      <div className="border-t border-line/60 pt-2 flex items-center justify-between text-xs text-muted">
                        <span>Distance: <strong className="text-ink">{currentRoute.distanceKm} km</strong></span>
                        <span>Est. Time: <strong className="text-ink">~{currentRoute.mins} mins</strong></span>
                      </div>
                    </div>

                    {/* Vehicle Type Tabs */}
                    <div>
                      <label className="label text-xs">Select vehicle type:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {FLEET.map((veh) => (
                          <button
                            key={veh.id}
                            type="button"
                            onClick={() => setActiveVehicle(veh.id)}
                            className={`flex flex-col items-center rounded-xl border p-2.5 text-center transition-all ${activeVehicle === veh.id
                                ? 'border-cng bg-cng-soft shadow-sm'
                                : 'border-line bg-white hover:bg-mist'
                              }`}
                          >
                            <span className="font-display text-sm font-bold">{veh.name.replace('Apna ', '')}</span>
                            <span className="text-[11px] text-muted">{veh.seats} {veh.seats === 1 ? 'seat' : 'seats'}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Result Banner */}
                    <div className="flex items-center justify-between rounded-xl bg-ink p-4 text-white">
                      <div>
                        <span className="text-xs text-white/70">Estimated Total Fare</span>
                        <p className="font-display text-3xl font-extrabold text-peeli">{money(estimatedFare)}</p>
                      </div>
                      <Link
                        to="/rider/signup"
                        className="btn btn-primary min-h-[40px] px-4 text-sm font-bold shadow-md"
                      >
                        Book Ride <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Metric Stats Strip */}
        <section className="border-b border-line bg-white py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div className="text-center sm:text-left">
                <p className="font-display text-3xl font-extrabold sm:text-4xl text-cng">₹0</p>
                <p className="mt-1 text-xs sm:text-sm text-muted">Hidden Commission on Autos</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="font-display text-3xl font-extrabold sm:text-4xl text-ink">&lt; 3 min</p>
                <p className="mt-1 text-xs sm:text-sm text-muted">Average Pickup Time</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="font-display text-3xl font-extrabold sm:text-4xl text-cng">100%</p>
                <p className="mt-1 text-xs sm:text-sm text-muted">Verified Captain Plates</p>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center gap-1 sm:justify-start">
                  <Star size={24} className="fill-peeli text-peeli" />
                  <p className="font-display text-3xl font-extrabold sm:text-4xl text-ink">4.9</p>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-muted">Rider Satisfaction Score</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Vehicle Fleet Showcase */}
        <section id="fleet" className="border-b border-line bg-mist py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-cng">Our Fleet</span>
              <h2 className="mt-1 text-3xl font-extrabold sm:text-4xl">Rides tailored for every trip</h2>
              <p className="mt-2 text-muted">
                From solo rush-hour sprints to comfortable family airport transfers, choose the vehicle that fits your journey.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {FLEET.map((veh) => (
                <div
                  key={veh.id}
                  className="flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-muted">{veh.category}</span>
                        <h3 className="font-display text-2xl font-bold">{veh.name}</h3>
                      </div>
                      <span className="rounded-full bg-cng-soft px-2.5 py-0.5 text-xs font-bold text-cng-dark">
                        {veh.badge}
                      </span>
                    </div>

                    <p className="text-sm text-muted">{veh.description}</p>

                    <div className="border-y border-line py-3 space-y-1.5 text-xs">
                      {veh.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2 text-ink">
                          <CheckCircle2 size={14} className="text-cng shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-line flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-muted">Fares from</span>
                      <p className="font-display text-xl font-bold">₹{veh.base} <span className="text-xs font-normal text-muted">+ ₹{veh.perKm}/km</span></p>
                    </div>
                    <Link
                      to="/rider/signup"
                      className="btn btn-ghost min-h-[38px] px-3.5 text-xs font-semibold"
                    >
                      Book <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Why Choose ApnaRide */}
        <section id="why-apnaride" className="border-b border-line bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-cng">Engineered Different</span>
              <h2 className="mt-1 text-3xl font-extrabold sm:text-4xl">Built for real Indian city roads</h2>
              <p className="mt-2 text-muted">
                No complex corporate layers or locked wallets. Transparent, fast, and community-driven.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: 'Atomic Fast Matching',
                  desc: 'Geospatial indexing matches you directly with the nearest online captain in real time via WebSockets.',
                  icon: Zap,
                },
                {
                  title: 'Secure Start OTP',
                  desc: 'Every ride begins with a private 6-digit verification code. Your driver cannot start the meter without your confirmation.',
                  icon: ShieldCheck,
                },
                {
                  title: 'Zero Wallet Lock-in',
                  desc: 'Pay cash or UPI directly to your captain at the end of the trip. No prepaid wallets or redemption hassle.',
                  icon: Wallet,
                },
                {
                  title: 'Direct Driver Income',
                  desc: 'Captains retain full control over their earnings with zero commission gouging on CNG auto rickshaws.',
                  icon: TrendingUp,
                },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-line bg-mist/30 p-6">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-cng text-white shadow-sm">
                      <IconComponent size={20} />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. Drive with ApnaRide: Earnings Calculator */}
        <section id="drive" className="border-b border-line bg-ink text-white py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="space-y-6 lg:col-span-6">
                <span className="rounded-full bg-peeli/20 border border-peeli/40 px-3 py-1 text-xs font-bold text-peeli">
                  Driver First Initiative
                </span>
                <h2 className="text-3xl font-extrabold sm:text-5xl leading-tight">
                  Drive your vehicle. <br />
                  <span className="text-peeli">Keep 100% of your fares.</span>
                </h2>
                <p className="text-white/80 text-base">
                  No weekly deduction surprises, no high commission fees. Register your auto, car, or bike, go online whenever you choose, and receive payment immediately after each trip.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-peeli" />
                    <span>0% commission on CNG Auto rides</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-peeli" />
                    <span>Instant daily cash &amp; UPI payouts</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-peeli" />
                    <span>Flexible hours: go online/offline anytime</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to="/captain/signup" className="btn btn-primary min-h-[48px] px-6 text-base">
                    Register as Captain <ArrowRight size={18} />
                  </Link>
                </div>
              </div>

              {/* Interactive Driver Earnings Card */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-peeli font-bold">Earnings Potential</p>
                      <h3 className="font-display text-xl font-bold">How much can you earn?</h3>
                    </div>
                    <Plate className="text-sm">KA 01 DR 9999</Plate>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span>Rides per day:</span>
                      <span className="text-peeli font-bold text-base">{dailyRides} rides/day</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={20}
                      step={1}
                      value={dailyRides}
                      onChange={(e) => setDailyRides(Number(e.target.value))}
                      className="w-full accent-peeli cursor-pointer h-2 bg-white/20 rounded-lg"
                    />
                    <div className="flex justify-between text-[11px] text-white/60 mt-1">
                      <span>Part time (2)</span>
                      <span>Regular (8)</span>
                      <span>Full time (20)</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/15 bg-black/40 p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-white/70">Estimated Monthly Earnings</span>
                      <p className="font-display text-3xl font-extrabold text-peeli">{money(estimatedMonthlyEarnings)}</p>
                      <span className="text-[11px] text-white/50">*Calculated over 26 working days</span>
                    </div>
                    <Link to="/captain/signup" className="btn btn-primary min-h-[40px] px-4 text-xs font-bold">
                      Start Driving
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Dual Conversion CTA Strip */}
        <section className="border-b border-line bg-white py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Rider Banner */}
              <div className="flex flex-col justify-between rounded-2xl bg-cng p-8 text-white shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Car size={24} className="text-peeli" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/80">For Daily Commuters</span>
                  </div>
                  <h3 className="font-display text-3xl font-extrabold">Ready to travel without surge?</h3>
                  <p className="text-white/85 text-sm">
                    Create an account in 30 seconds and book your first ride across town with zero hassle.
                  </p>
                </div>
                <div className="pt-6">
                  <Link to="/rider/signup" className="btn btn-primary min-h-[44px] px-6 text-sm font-bold">
                    Sign up to Ride <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              {/* Captain Banner */}
              <div className="flex flex-col justify-between rounded-2xl border-2 border-ink bg-mist p-8 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={24} className="text-cng" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">For Vehicle Owners</span>
                  </div>
                  <h3 className="font-display text-3xl font-extrabold">Turn your vehicle into an asset</h3>
                  <p className="text-muted text-sm">
                    Register your commercial auto, cab, or bike and start receiving trip requests in your neighbourhood.
                  </p>
                </div>
                <div className="pt-6">
                  <Link to="/captain/signup" className="btn btn-ghost min-h-[44px] px-6 text-sm font-bold border-ink hover:bg-ink hover:text-white">
                    Register as Captain <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FAQ Accordion */}
        <section className="bg-mist py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-cng">Got Questions?</span>
              <h2 className="mt-1 text-3xl font-extrabold sm:text-4xl">Frequently Asked Questions</h2>
            </div>

            <div className="mt-10 space-y-3">
              {FAQS.map((faq, idx) => (
                <div
                  key={faq.q}
                  className="rounded-xl border border-line bg-white shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="flex w-full items-center justify-between p-4 sm:p-5 text-left font-display font-bold text-base sm:text-lg hover:text-cng transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-cng' : 'text-muted'
                        }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 pb-5 sm:px-5 text-sm sm:text-base text-muted animate-fade-up">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 9. Comprehensive Modern Footer */}
      <footer className="border-t border-line bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-3 sm:col-span-2">
              <Brand />
              <p className="max-w-sm text-sm text-muted">
                ApnaRide is a modern, transparent ride-hailing platform engineered with Node.js, Express, React, and Socket.IO.
              </p>
              <p className="text-xs text-muted">
                Maps &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap</a> contributors.
              </p>
            </div>

            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wider text-ink">Riders</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link to="/rider/login" className="hover:text-ink">Rider Log in</Link></li>
                <li><Link to="/rider/signup" className="hover:text-ink">Create Account</Link></li>
                <li><a href="#estimator" className="hover:text-ink">Fare Estimator</a></li>
                <li><a href="#fleet" className="hover:text-ink">Fleet Options</a></li>
              </ul>
            </div>

            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wider text-ink">Captains</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li><Link to="/captain/login" className="hover:text-ink">Captain Log in</Link></li>
                <li><Link to="/captain/signup" className="hover:text-ink">Register Vehicle</Link></li>
                <li><a href="#drive" className="hover:text-ink">Earnings Calculator</a></li>
                <li><span className="text-xs text-cng font-semibold">0% Commission on Autos</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-2">
            <p>&copy; {new Date().getFullYear()} Apna Shehar, Apni Ride.</p>
            <div className="flex gap-4">
              <span>Fast WebSocket Realtime</span>
              <span>•</span>
              <span>Geospatial Matching</span>
              <span>•</span>
              <span>Cash &amp; UPI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
