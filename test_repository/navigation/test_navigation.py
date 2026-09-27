def test_position_calculation():

    latitude = 13.0827
    longitude = 80.2707

    assert isinstance(latitude, float)
    assert isinstance(longitude, float)


def test_heading_calculation():

    heading = 120
    correction = 10

    result = heading + correction

    assert result == 130