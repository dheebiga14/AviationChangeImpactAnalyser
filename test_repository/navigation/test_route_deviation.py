def test_route_deviation():

    current_latitude = 13.5
    planned_latitude = 13.0

    deviation = abs(
        current_latitude - planned_latitude
    )

    assert deviation > 0