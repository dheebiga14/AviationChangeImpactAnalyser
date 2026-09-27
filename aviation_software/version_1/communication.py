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


def communication_status():
    return "Communication system operating normally"