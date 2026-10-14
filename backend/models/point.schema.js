const mongoose = require('mongoose');

// GeoJSON Point. MongoDB geospatial queries require exactly this shape: [longitude, latitude].
module.exports = new mongoose.Schema({
    type: { type: String, enum: [ 'Point' ], default: 'Point', required: true },
    coordinates: {
        type: [ Number ],
        required: true,
        validate: {
            validator: (c) => c.length === 2 && c[ 0 ] >= -180 && c[ 0 ] <= 180 && c[ 1 ] >= -90 && c[ 1 ] <= 90,
            message: 'coordinates must be [longitude, latitude]',
        },
    },
}, { _id: false });
