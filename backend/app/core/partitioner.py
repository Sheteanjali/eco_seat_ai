def split_slots(students, room_capacity):
    """
    Auto-split logic to divide 1,500 students based on room capacity.
    Ensures optimal density for two time slots.
    """
    # Total students / capacity determines the sessions needed
    morning_batch = students[:room_capacity]
    afternoon_batch = students[room_capacity:]
    
    return {
        "morning": morning_batch,
        "afternoon": afternoon_batch
    }