def calculate_position(latitude, longitude):
    return {
        "latitude": latitude,
        "longitude": longitude
    }


def calculate_heading(current_heading, correction):
    return current_heading + correction


def navigation_status():
    return "Navigation system operating normally"