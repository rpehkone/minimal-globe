function latLonAltToECEF(lat, lon, h) {
	// WGS-84 ellipsoidal parameters
	const a = 6378137.0 // Semi-major axis in meters
	const f = 1 / 298.257223563 // Flattening
	const eSq = f * (2 - f) // Square of eccentricity

	//deg to rad
	const latRad = lat * Math.PI / 180
	const lonRad = lon * Math.PI / 180

	// Prime vertical radius of curvature
	const N = a / Math.sqrt(1 - eSq * Math.sin(latRad) ** 2)

	// ECEF coordinates
	const x = (N + h) * Math.cos(latRad) * Math.cos(lonRad)
	const y = (N + h) * Math.cos(latRad) * Math.sin(lonRad)
	const z = ((1 - eSq) * N + h) * Math.sin(latRad)

	return { x, y, z }
}
