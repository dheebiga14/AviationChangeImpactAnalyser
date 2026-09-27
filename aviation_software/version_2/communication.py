from aircraft_monitoring import monitor_route_deviation


def send_message(message):

    return {
        "status": "SENT",
        "message": message
    }


def receive_message(message):

    return {
        "status": "RECEIVED",
        "message": message
    }


def send_emergency_message(message):

    return {
        "status": "EMERGENCY",
        "message": message
    }


def communication_status():
    return "Communication system operating normally"