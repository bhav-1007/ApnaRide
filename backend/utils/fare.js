/**
 * Pure functions for fare calculations based on vehicle type, distance, and duration.
 */
const RATES = Object.freeze({
    auto: { base: 30, perKm: 10, perMin: 2 },
    car: { base: 50, perKm: 15, perMin: 3 },
    moto: { base: 20, perKm: 8, perMin: 1.5 },
});

function calculateFare(vehicleType, distanceMeters, durationSeconds) {
    const rate = RATES[vehicleType];
    if (!rate) {
        throw new Error(`Unknown vehicle type: ${vehicleType}`);
    }
    const km = distanceMeters / 1000;
    const minutes = durationSeconds / 60;
    return Math.round(rate.base + km * rate.perKm + minutes * rate.perMin);
}

function calculateFares(distanceMeters, durationSeconds) {
    return Object.fromEntries(
        Object.keys(RATES).map((type) => [type, calculateFare(type, distanceMeters, durationSeconds)])
    );
}

module.exports = {
    RATES,
    calculateFare,
    calculateFares,
};
