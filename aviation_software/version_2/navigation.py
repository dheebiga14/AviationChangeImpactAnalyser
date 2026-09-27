def calculate_position(latitude, longitude):
    return {
        "latitude": latitude,
        "longitude": longitude
    }


def calculate_heading(current_heading, correction):
    return current_heading + correction


def calculate_route_deviation(
    current_latitude,
    current_longitude,
    planned_latitude,
    planned_longitude
):
    latitude_difference = abs(
        current_latitude - planned_latitude
    )

    longitude_difference = abs(
        current_longitude - planned_longitude
    )

    deviation = latitude_difference + longitude_difference

    if deviation > 2:
        return "HIGH DEVIATION"

    if deviation > 0.5:
        return "MEDIUM DEVIATION"

    return "NORMAL"


def navigation_status():
    return "Navigation system operating normally"