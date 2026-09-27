from fastapi import APIRouter, Body
from backend.simulator.flight_simulator import shared_simulator

router = APIRouter(
    prefix="/api/flights",
    tags=["Flights"]
)


@router.get("/")
def get_flights():
    """Retrieve current snapshot of all active simulated flights."""
    shared_simulator.update_flights()
    return {
        "success": True,
        "flights": shared_simulator.get_snapshot()
    }


@router.get("/events")
def get_flight_events():
    """Retrieve recent simulation event logs."""
    return {
        "success": True,
        "events": shared_simulator.get_logs()
    }


@router.get("/simulation/status")
def get_simulation_status():
    """Retrieve current flight simulation lifecycle and telemetry status."""
    return {
        "success": True,
        "simulation": shared_simulator.get_status(),
        "flights": shared_simulator.get_snapshot()
    }


@router.post("/simulation/start")
def start_simulation():
    """Start or resume the flight simulation without resetting aircraft coordinates."""
    res = shared_simulator.start()
    return {
        "success": True,
        "action": "start",
        "result": res,
        "flights": shared_simulator.get_snapshot()
    }


@router.post("/simulation/pause")
def pause_simulation():
    """Pause flight simulation updates immediately, freezing aircraft positions."""
    res = shared_simulator.pause()
    return {
        "success": True,
        "action": "pause",
        "result": res,
        "flights": shared_simulator.get_snapshot()
    }


@router.post("/simulation/reset")
def reset_simulation():
    """Reset all aircraft back to initial simulation state and nominal route progress."""
    res = shared_simulator.reset()
    return {
        "success": True,
        "action": "reset",
        "result": res,
        "flights": shared_simulator.get_snapshot()
    }


@router.post("/simulation/speed")
def set_simulation_speed(payload: dict = Body(...)):
    """Set simulation speed multiplier (1x, 2x, 5x)."""
    speed = payload.get("speed", 1.0)
    res = shared_simulator.set_speed(speed)
    return {
        "success": True,
        "action": "speed",
        "speed": shared_simulator.speed_multiplier,
        "result": res
    }


@router.post("/simulation/stop")
def stop_simulation():
    """Stop/pause flight simulation updates immediately, freezing aircraft positions."""
    res = shared_simulator.stop()
    return {
        "success": True,
        "action": "stop",
        "simulation": shared_simulator.get_status(),
        "result": res,
        "flights": shared_simulator.get_snapshot()
    }


@router.post("/control")
def control_simulation(payload: dict = Body(...)):
    """Control the flight simulator: action = 'start' | 'pause' | 'stop' | 'reset' | 'inject_event' | 'speed'."""
    action = payload.get("action", "start")
    event_type = payload.get("event", "normal")
    speed = payload.get("speed", 1.0)

    if action in ("start", "resume"):
        res = shared_simulator.start()
    elif action in ("pause", "stop"):
        res = shared_simulator.pause()
    elif action == "reset":
        res = shared_simulator.reset()
    elif action == "speed":
        res = shared_simulator.set_speed(speed)
    elif action == "inject_event":
        res = shared_simulator.inject_event(event_type)
    else:
        return {"success": False, "message": f"Unknown action: {action}"}

    return {
        "success": True,
        "action": action,
        "simulation": shared_simulator.get_status(),
        "result": res,
        "flights": shared_simulator.get_snapshot()
    }


@router.get("/{flight_id}")
def get_flight(flight_id: str):
    """Retrieve real-time telemetry for a specific aircraft."""
    flights = shared_simulator.get_snapshot()
    for flight in flights:
        if flight["flight_id"] == flight_id:
            return {
                "success": True,
                "flight": flight
            }

    return {
        "success": False,
        "message": f"Flight {flight_id} not found"
    }