import math
import random

AIRPORT_COORDINATES = {
    "Chennai": (13.0827, 80.2707),
    "Delhi": (28.6139, 77.2090),
    "Mumbai": (19.0760, 72.8777),
    "Bengaluru": (12.9716, 77.5946),
    "Singapore": (1.3521, 103.8198),
    "Dubai": (25.2048, 55.2708),
    "London": (51.5074, -0.1278),
    "Tokyo": (35.6762, 139.6503),
    "Kochi": (9.9312, 76.2673),
    "Coimbatore": (11.0168, 76.9558)
}


def calculate_bearing(lat1, lon1, lat2, lon2):
    """Calculate geographic forward azimuth heading between two coordinates in degrees."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    theta = math.atan2(y, x)
    bearing = (math.degrees(theta) + 360) % 360
    return round(bearing, 1)


def interpolate_great_circle(lat1, lon1, lat2, lon2, f):
    """Calculate intermediate coordinate along a Great Circle geodesic at fraction f (0.0 to 1.0)."""
    if f <= 0.0:
        return (round(lat1, 4), round(lon1, 4))
    if f >= 1.0:
        return (round(lat2, 4), round(lon2, 4))

    phi1 = math.radians(lat1)
    lambda1 = math.radians(lon1)
    phi2 = math.radians(lat2)
    lambda2 = math.radians(lon2)

    # Angular distance
    d = 2 * math.asin(
        math.sqrt(
            math.sin((phi2 - phi1) / 2) ** 2 +
            math.cos(phi1) * math.cos(phi2) * (math.sin((lambda2 - lambda1) / 2) ** 2)
        )
    )

    if d < 1e-6:
        return (round(lat1, 4), round(lon1, 4))

    a = math.sin((1 - f) * d) / math.sin(d)
    b = math.sin(f * d) / math.sin(d)

    x = a * math.cos(phi1) * math.cos(lambda1) + b * math.cos(phi2) * math.cos(lambda2)
    y = a * math.cos(phi1) * math.sin(lambda1) + b * math.cos(phi2) * math.sin(lambda2)
    z = a * math.sin(phi1) + b * math.sin(phi2)

    phi_f = math.atan2(z, math.sqrt(x ** 2 + y ** 2))
    lambda_f = math.atan2(y, x)

    return (round(math.degrees(phi_f), 4), round(math.degrees(lambda_f), 4))


def generate_route(departure, destination):
    start = AIRPORT_COORDINATES.get(departure, (13.0827, 80.2707))
    end = AIRPORT_COORDINATES.get(destination, (28.6139, 77.2090))

    initial_heading = calculate_bearing(start[0], start[1], end[0], end[1])

    # Initial start position along route (stagger initial progress between 15% and 65%)
    initial_progress = random.uniform(0.2, 0.6)
    curr_lat, curr_lon = interpolate_great_circle(start[0], start[1], end[0], end[1], initial_progress)

    return {
        "start": start,
        "end": end,
        "latitude": curr_lat,
        "longitude": curr_lon,
        "heading": initial_heading,
        "progress": initial_progress
    }