from navigation import calculate_position


def create_flight_plan(origin, destination, altitude):
    return {
        "origin": origin,
        "destination": destination,
        "cruise_altitude": altitude
    }


def estimate_flight_time(distance, speed):
    if speed <= 0:
        return 0

    return distance / speed


def flight_plan_status():
    return "Flight planning system operating normally"