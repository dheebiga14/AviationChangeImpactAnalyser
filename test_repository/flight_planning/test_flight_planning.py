from aviation_software.version_2.flight_planning import (
    create_flight_plan,
    estimate_flight_time,
    calculate_fuel_requirement
)


def test_create_flight_plan():
    result = create_flight_plan(
        "Chennai",
        "Delhi",
        35000
    )

    assert result["origin"] == "Chennai"
    assert result["destination"] == "Delhi"
    assert result["cruise_altitude"] == 35000


def test_create_flight_plan_with_fuel():
    result = create_flight_plan(
        "Chennai",
        "Delhi",
        35000,
        1200
    )

    assert result["fuel_required"] == 1200


def test_estimate_flight_time():
    result = estimate_flight_time(
        3000,
        500
    )

    assert result == 6


def test_estimate_flight_time_invalid_speed():
    result = estimate_flight_time(
        3000,
        0
    )

    assert result == 0


def test_calculate_fuel_requirement():
    result = calculate_fuel_requirement(
        1000,
        2.5
    )

    assert result == 2500