from dataclasses import dataclass


@dataclass
class FlightState:
    flight_id: str
    latitude: float
    longitude: float
    altitude: float
    speed: float
    heading: float
    fuel: float
    status: str = "AIRBORNE"
    risk: str = "LOW"

    def update_position(self, latitude, longitude):
        self.latitude = latitude
        self.longitude = longitude

    def update_altitude(self, altitude):
        self.altitude = altitude

    def update_speed(self, speed):
        self.speed = speed

    def update_heading(self, heading):
        self.heading = heading

    def update_fuel(self, fuel):
        self.fuel = max(0, fuel)

    def update_risk(self, risk):
        self.risk = risk

    def to_dict(self):
        return {
            "flight_id": self.flight_id,
            "latitude": round(self.latitude, 4),
            "longitude": round(self.longitude, 4),
            "altitude": round(self.altitude, 0),
            "speed": round(self.speed, 1),
            "heading": round(self.heading, 1),
            "fuel": round(self.fuel, 2),
            "status": self.status,
            "risk": self.risk
        }