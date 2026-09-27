from navigation import calculate_position


def monitor_altitude(altitude):

    if altitude < 10000:
        return "LOW"

    if altitude > 45000:
        return "HIGH"

    return "NORMAL"


def monitor_speed(speed):

    if speed < 250:
        return "LOW"

    if speed > 600:
        return "HIGH"

    return "NORMAL"


def monitor_route_deviation(deviation):

    if deviation > 2:
        return "CRITICAL"

    if deviation > 0.5:
        return "WARNING"

    return "NORMAL"


def aircraft_status():
    return "Aircraft monitoring system operating normally"