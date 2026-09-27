class Aircraft:

    def __init__(
        self,
        flight_id,
        aircraft_type,
        departure,
        destination
    ):
        self.flight_id = flight_id
        self.aircraft_type = aircraft_type
        self.departure = departure
        self.destination = destination