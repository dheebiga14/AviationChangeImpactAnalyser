def get_weather(
    temperature,
    wind_speed,
    visibility,
    turbulence=0
):
    return {
        "temperature": temperature,
        "wind_speed": wind_speed,
        "visibility": visibility,
        "turbulence": turbulence
    }


def weather_warning(visibility):

    if visibility < 3000:
        return "LOW VISIBILITY WARNING"

    return "WEATHER NORMAL"


def turbulence_warning(turbulence):

    if turbulence > 7:
        return "SEVERE TURBULENCE"

    if turbulence > 4:
        return "MODERATE TURBULENCE"

    return "NORMAL"