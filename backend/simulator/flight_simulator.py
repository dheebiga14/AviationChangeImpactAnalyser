import random
import time
from datetime import datetime
from .aircraft import Aircraft
from .route_generator import generate_route, calculate_bearing


class FlightSimulator:
    def __init__(self):
        self.is_running = True
        self.is_paused = False
        self.speed_multiplier = 1.0
        self.active_event = "normal"
        self.events_log = []
        self.sim_elapsed_seconds = 0
        self.last_tick = time.time()
        self.init_flights(start_at_origin=True)

    def init_flights(self, start_at_origin=True):
        self.aircraft_configs = [
            ("AI101", "Boeing 737", "Chennai", "Delhi", "LOW", 22, 35200, 482),
            ("AI202", "Airbus A320", "Mumbai", "Bengaluru", "MEDIUM", 48, 31800, 455),
            ("AI303", "Boeing 777", "Delhi", "Singapore", "HIGH", 74, 38100, 510),
            ("AI404", "Airbus A350", "Dubai", "London", "LOW", 19, 39000, 495),
            ("AI505", "Boeing 787", "Singapore", "Tokyo", "MEDIUM", 42, 36500, 488),
        ]

        self.flights = []
        now_str = datetime.utcnow().strftime("%H:%M:%S UTC")

        for fid, atype, dep, dest, base_risk, base_score, base_alt, base_spd in self.aircraft_configs:
            route = generate_route(dep, dest)
            start_coords = route["start"]
            end_coords = route["end"]

            initial_prog = 0.0 if start_at_origin else route["progress"]
            curr_lat = start_coords[0] if start_at_origin else route["latitude"]
            curr_lon = start_coords[1] if start_at_origin else route["longitude"]
            initial_heading = calculate_bearing(start_coords[0], start_coords[1], end_coords[0], end_coords[1])

            flight_obj = {
                "flight_id": fid,
                "aircraft": atype,
                "departure": dep,
                "destination": dest,
                "route": f"{dep} → {dest}",
                "origin_coords": list(start_coords),
                "dest_coords": list(end_coords),
                "latitude": round(curr_lat, 4),
                "longitude": round(curr_lon, 4),
                "altitude": 10000 if start_at_origin else base_alt,
                "base_altitude": base_alt,
                "speed": base_spd,
                "base_speed": base_spd,
                "heading": initial_heading,
                "status": "Airborne",
                "mode": "SIMULATION",
                "fuel": round(random.uniform(75.0, 88.0), 1),
                "risk": base_risk,
                "risk_score": base_score,
                "progress": round(initial_prog, 4),
                "speed_step": round(random.uniform(0.0012, 0.0022), 5),
                "trail": [[round(curr_lat, 4), round(curr_lon, 4)]],
                "holding_countdown": 12,
                "last_update": now_str,
                "anomaly": None,
                "events": [
                    {"time": "10:32 UTC", "text": "Takeoff clearance confirmed"},
                    {"time": "10:47 UTC", "text": "Climb through FL280 to cruise"},
                    {"time": "11:05 UTC", "text": "Cruising envelope stabilized"}
                ]
            }
            self.flights.append(flight_obj)

        self.add_event_log("SYSTEM", "Flight Simulator initialized at origin airports.")

    def add_event_log(self, source, message):
        t_str = datetime.utcnow().strftime("%H:%M:%S")
        self.events_log.insert(0, {
            "timestamp": t_str,
            "source": source,
            "message": message
        })
        if len(self.events_log) > 50:
            self.events_log = self.events_log[:50]

    def get_sim_time_str(self):
        hours = (self.sim_elapsed_seconds // 3600) % 24
        minutes = (self.sim_elapsed_seconds // 60) % 60
        seconds = self.sim_elapsed_seconds % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    def update_flights(self):
        if not self.is_running or self.is_paused:
            return

        now = time.time()
        # Rate-limit updates so multiple websocket streams or polls don't advance the simulation too fast
        dt = now - self.last_tick
        if dt < 0.75:
            return
        self.last_tick = now
        self.sim_elapsed_seconds += int(dt * self.speed_multiplier)

        now_str = datetime.utcnow().strftime("%H:%M:%S UTC")

        from .route_generator import AIRPORT_COORDINATES

        for flight in self.flights:
            if flight["status"] == "Arrived":
                flight["holding_countdown"] -= 1
                if flight["holding_countdown"] <= 0:
                    # Turnaround: Swap origin and destination for return flight
                    dep = flight["destination"]
                    dest = flight["departure"]
                    flight["departure"] = dep
                    flight["destination"] = dest
                    flight["route"] = f"{dep} → {dest}"
                    flight["origin_coords"] = list(AIRPORT_COORDINATES[dep])
                    flight["dest_coords"] = list(AIRPORT_COORDINATES[dest])
                    flight["progress"] = 0.0
                    flight["status"] = "Airborne"
                    flight["speed"] = flight["base_speed"]
                    flight["altitude"] = 10000
                    flight["latitude"] = round(flight["origin_coords"][0], 4)
                    flight["longitude"] = round(flight["origin_coords"][1], 4)
                    flight["heading"] = calculate_bearing(
                        flight["origin_coords"][0], flight["origin_coords"][1],
                        flight["dest_coords"][0], flight["dest_coords"][1]
                    )
                    flight["trail"] = [[flight["latitude"], flight["longitude"]]]
                    flight["fuel"] = round(random.uniform(80.0, 90.0), 1)
                    flight["holding_countdown"] = 12
                    self.add_event_log(flight["flight_id"], f"Turnaround complete at {dep}. Departed on return leg for {dest}.")
                continue

            # Advance progress along route
            flight["progress"] += flight["speed_step"] * self.speed_multiplier

            # Handle destination arrival
            if flight["progress"] >= 1.0:
                flight["progress"] = 1.0
                flight["status"] = "Arrived"
                flight["speed"] = 0
                flight["altitude"] = 0
                flight["latitude"] = round(flight["dest_coords"][0], 4)
                flight["longitude"] = round(flight["dest_coords"][1], 4)
                flight["holding_countdown"] = 12
                self.add_event_log(flight["flight_id"], f"Arrived safely at destination {flight['destination']}. Disembarking.")
            else:
                # Interpolate geographic position along actual Great Circle geodesic route
                start = flight["origin_coords"]
                dest = flight["dest_coords"]
                prog = flight["progress"]
                from .route_generator import interpolate_great_circle
                new_lat, new_lon = interpolate_great_circle(start[0], start[1], dest[0], dest[1], prog)

                flight["latitude"] = round(new_lat, 4)
                flight["longitude"] = round(new_lon, 4)

                # Calculate forward azimuth heading towards destination
                flight["heading"] = calculate_bearing(new_lat, new_lon, dest[0], dest[1])

                # Gradual realistic altitude profiling (climb, cruise, descent)
                if prog < 0.10:
                    flight["altitude"] = int(10000 + (flight["base_altitude"] - 10000) * (prog / 0.10))
                elif prog > 0.90:
                    flight["altitude"] = int(2000 + (flight["base_altitude"] - 2000) * ((1.0 - prog) / 0.10))
                else:
                    flight["altitude"] += random.randint(-15, 15)
                    flight["altitude"] = max(28000, min(42000, flight["altitude"]))

                # Realistic airspeed variance
                flight["speed"] += random.randint(-1, 1)
                flight["speed"] = max(flight["base_speed"] - 20, min(flight["base_speed"] + 20, flight["speed"]))

                # Record breadcrumb trail
                curr_pos = [flight["latitude"], flight["longitude"]]
                if not flight["trail"] or (abs(flight["trail"][-1][0] - curr_pos[0]) > 0.05 or abs(flight["trail"][-1][1] - curr_pos[1]) > 0.05):
                    flight["trail"].append(curr_pos)
                    if len(flight["trail"]) > 50:
                        flight["trail"].pop(0)

                # Gradual fuel consumption
                flight["fuel"] = max(0.0, round(flight["fuel"] - 0.008 * self.speed_multiplier, 2))

            flight["last_update"] = now_str

            # Event-specific overrides
            if self.active_event == "nav_anomaly" and flight["flight_id"] == "AI303":
                flight["risk"] = "HIGH"
                flight["risk_score"] = 78
                flight["anomaly"] = "IRS Gyro Drift Warning"
            elif self.active_event == "comm_failure" and flight["flight_id"] == "AI202":
                flight["risk"] = "HIGH"
                flight["risk_score"] = 68
                flight["anomaly"] = "CPDLC Signal Degraded"
            elif self.active_event == "weather_impact" and flight["flight_id"] == "AI505":
                flight["risk"] = "HIGH"
                flight["risk_score"] = 71
                flight["anomaly"] = "Severe Convective Storm Offset"
            elif self.active_event == "route_deviation" and flight["flight_id"] == "AI101":
                flight["risk"] = "MEDIUM"
                flight["risk_score"] = 58
                flight["anomaly"] = "Cross-Track Deviation +2.8 NM"

    def inject_event(self, event_type: str):
        self.active_event = event_type
        t_str = datetime.utcnow().strftime("%H:%M:%S UTC")

        if event_type == "normal":
            for f in self.flights:
                f["anomaly"] = None
                for cfg in self.aircraft_configs:
                    if cfg[0] == f["flight_id"]:
                        f["risk"] = cfg[4]
                        f["risk_score"] = cfg[5]
            self.add_event_log("EVENT_INJECTOR", "Simulator returned to normal flight parameters.")

        elif event_type == "nav_anomaly":
            self.add_event_log("EVENT_INJECTOR", "Anomaly Injected: AI303 Inertial Reference System (IRS) Gyro Drift.")
            for f in self.flights:
                if f["flight_id"] == "AI303":
                    f["risk"] = "HIGH"
                    f["risk_score"] = 82
                    f["anomaly"] = "IRS Gyro Drift Warning"
                    f["events"].append({"time": t_str, "text": "IRS Gyro drift flagged by FMS"})

        elif event_type == "route_deviation":
            self.add_event_log("EVENT_INJECTOR", "Anomaly Injected: AI101 Cross-Track Route Deviation > 2.5 NM.")
            for f in self.flights:
                if f["flight_id"] == "AI101":
                    f["risk"] = "MEDIUM"
                    f["risk_score"] = 58
                    f["anomaly"] = "Cross-Track Deviation +2.8 NM"
                    f["events"].append({"time": t_str, "text": "Cross-track corridor exceedance"})

        elif event_type == "comm_failure":
            self.add_event_log("EVENT_INJECTOR", "Anomaly Injected: AI202 CPDLC primary link timeout.")
            for f in self.flights:
                if f["flight_id"] == "AI202":
                    f["risk"] = "HIGH"
                    f["risk_score"] = 68
                    f["anomaly"] = "CPDLC Signal Degraded"
                    f["events"].append({"time": t_str, "text": "Switched to secondary HF transceiver"})

        elif event_type == "weather_impact":
            self.add_event_log("EVENT_INJECTOR", "Anomaly Injected: AI505 Severe weather avoidance maneuver.")
            for f in self.flights:
                if f["flight_id"] == "AI505":
                    f["risk"] = "HIGH"
                    f["risk_score"] = 71
                    f["anomaly"] = "Severe Convective Storm Offset"
                    f["events"].append({"time": t_str, "text": "ATC approved 20 NM weather detour"})

        return {
            "status": "success",
            "active_event": self.active_event,
            "message": f"Event '{event_type}' injected successfully"
        }

    def get_status(self):
        if self.is_running and not self.is_paused:
            st = "RUNNING"
        elif self.is_paused:
            st = "PAUSED"
        else:
            st = "STOPPED"
        return {
            "status": st,
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "speed": self.speed_multiplier,
            "active_event": self.active_event,
            "flights_count": len(self.flights),
            "sim_time": self.get_sim_time_str(),
            "sim_elapsed": self.sim_elapsed_seconds
        }

    def set_speed(self, speed: float):
        try:
            self.speed_multiplier = max(0.5, min(10.0, float(speed)))
        except (ValueError, TypeError):
            self.speed_multiplier = 1.0
        self.add_event_log("CONTROL", f"Simulation speed adjusted to {self.speed_multiplier}x.")
        return self.get_status()

    def start(self):
        self.is_running = True
        self.is_paused = False
        self.last_tick = time.time()
        self.add_event_log("CONTROL", "Simulation started/resumed.")
        return self.get_status()

    def pause(self):
        self.is_paused = True
        self.add_event_log("CONTROL", "Simulation paused.")
        return self.get_status()

    def stop(self):
        self.is_running = False
        self.is_paused = True
        self.add_event_log("CONTROL", "Simulation stopped.")
        return self.get_status()

    def reset(self):
        self.active_event = "normal"
        self.is_running = True
        self.is_paused = False
        self.speed_multiplier = 1.0
        self.sim_elapsed_seconds = 0
        self.last_tick = time.time()
        self.init_flights(start_at_origin=True)
        self.add_event_log("CONTROL", "Simulation reset to origin airports and resumed departure.")
        return self.get_status()

    def get_snapshot(self):
        return self.flights

    def get_logs(self):
        return self.events_log


# Global shared simulator instance for main and routes
shared_simulator = FlightSimulator()