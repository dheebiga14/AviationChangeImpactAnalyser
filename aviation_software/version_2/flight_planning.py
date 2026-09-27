from navigation import calculate_position


def create_flight_plan(
    origin,
    destination,
    altitude,
    fuel_required=0
):
    return {
        "origin": origin,
        "destination": destination,
        "cruise_altitude": altitude,
        "fuel_required": fuel_required
    }


def estimate_flight_time(distance, speed):
    if speed <= 0:
        return 0

    return distance / speed


def calculate_fuel_requirement(
    distance,
    fuel_rate
):
    return distance * fuel_rate


def flight_plan_status():
    return "Flight planning system operating normally"