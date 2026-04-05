import json

def generate_seat_qr(student_roll, room_no, seat_label, time_slot):
    """
    Generates QR-integrated access data for digital confirmation.
    """
    # Encodes unique identifiers per seat to ensure secure verification.
    access_data = {
        "roll_no": student_roll,
        "room": room_no,
        "seat": seat_label,
        "slot": time_slot # 9:30-12:30 or 2:00-5:00
    }
    # This string is sent to the React frontend to render the QR code.
    return json.dumps(access_data)