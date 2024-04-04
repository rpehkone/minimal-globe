function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

function fmod(a, b) {
    return a - Math.floor(a / b) * b;
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

function clamp01(value) {
	return Math.max(0.0, Math.min(1.0, value));
}

function log2(x) {
	let isNeg = false
	if (x < 0) {
		isNeg = true
		x *= -1
	}

	let res = Math.log(x) / Math.log(2);
	if (isNaN(res) || res === Infinity || res === -Infinity) {
		return x
	}

	if (isNeg) {
		res *= -1
	}
	return res
}


const cartography = {
    tileToLatLon: function(z, x, y) {
        const n = Math.pow(2, z);
        const lon_deg = x / n * 360 - 180;
        const lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
        const lat_deg = lat_rad * 180 / Math.PI;
        return { lat: lat_deg, lon: lon_deg };
    },

    tileDimensions: function(z) {
        const n = Math.pow(2, z);
        const lat1_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * 0 / n)));
        const lat2_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * 1 / n)));
        const lat_diff_rad = lat1_rad - lat2_rad;
        const lat_diff_deg = lat_diff_rad * 180 / Math.PI;
        const lon_diff_deg = 360 / n;
        return { height: lat_diff_deg, width: lon_diff_deg };
    },

	getTileCorners: function(z, x, y) {
        const { height, width } = this.tileDimensions(z);
        const upperLeft = this.tileToLatLon(z, x, y);
        const upperRight = this.tileToLatLon(z, x + 1, y);
        const lowerLeft = this.tileToLatLon(z, x, y + 1);
        const lowerRight = this.tileToLatLon(z, x + 1, y + 1);
        return { upperLeft, upperRight, lowerLeft, lowerRight };
    },

	latLonAltToECEF: function(lat, lon, h) {
		// WGS-84 ellipsoidal parameters
		const a = 6378137.0 // Semi-major axis in meters
		const f = 1 / 298.257223563 // Flattening
		const eSq = f * (2 - f) // Square of eccentricity

		//deg to rad
		const latRad = degToRad(lat)
		const lonRad = degToRad(lon)

		// Prime vertical radius of curvature
		const N = a / Math.sqrt(1 - eSq * Math.sin(latRad) ** 2)

		// ECEF coordinates
		const x = (N + h) * Math.cos(latRad) * Math.cos(lonRad)
		const y = (N + h) * Math.cos(latRad) * Math.sin(lonRad)
		const z = ((1 - eSq) * N + h) * Math.sin(latRad)

		// idk wtf this coordinate system
		let res = vec3.fromValues(x, z, -y)
		return res
		//normalize
		const result = vec3.create();
		vec3.divide(result, res, vec3.fromValues(a, a, a))
		return result
	},

}
