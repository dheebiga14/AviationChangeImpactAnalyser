def get_weather(temperature, wind_speed, visibility):
    return {
        "temperature": temperature,
        "wind_speed": wind_speed,
        "visibility": visibility
    }


def weather_warning(visibility):
    if visibility < 3000:
        return "LOW VISIBILITY WARNING"

    return "WEATHER NORMAL"