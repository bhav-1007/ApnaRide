const maps = require('../utils/maps');
const { asyncHandler } = require('../utils/httpError');

const mapController = {
    suggestions: asyncHandler(async (req, res) => {
        const results = await maps.searchPlaces(req.query.input);
        res.status(200).json(results);
    }),

    reverse: asyncHandler(async (req, res) => {
        const result = await maps.reversePlace(req.query.lat, req.query.lng);
        res.status(200).json(result);
    }),
};

module.exports = mapController;
