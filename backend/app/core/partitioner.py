import math

def split_slots(students, room_capacity, max_slots=2):
    """
    Divides a student candidate list across multiple exam time slots based on total
    available seat capacity. Ensures balanced density across sessions.
    
    :param list students: List of candidate student dictionaries.
    :param int room_capacity: Maximum total seats available across active rooms per slot.
    :param int max_slots: Maximum allowable time slots per exam day (default: 2).
    :return: Dict containing segmented student lists and timing metadata.
    """
    if not students or room_capacity <= 0:
        return {"morning": [], "afternoon": [], "unassigned": []}

    total_students = len(students)
    
    # Calculate optimal target batch size to balance room density across shifts
    if total_students <= room_capacity:
        target_batch_size = total_students
    else:
        # Distribute candidates as evenly as possible across slots
        target_batch_size = math.ceil(total_students / min(max_slots, math.ceil(total_students / room_capacity)))

    # Slice batches cleanly
    morning_batch = students[:target_batch_size]
    afternoon_batch = students[target_batch_size : target_batch_size * 2]
    unassigned_batch = students[target_batch_size * 2 :]

    # Inject shift time metadata into student dicts
    for s in morning_batch:
        if isinstance(s, dict):
            s['shift'] = 'Morning'
            s['exam_time'] = '09:30 AM - 12:30 PM'

    for s in afternoon_batch:
        if isinstance(s, dict):
            s['shift'] = 'Afternoon'
            s['exam_time'] = '02:00 PM - 05:00 PM'

    if unassigned_batch:
        print(f"⚠️ [SLOT SPLIT WARNING] - {len(unassigned_batch)} students exceed the 2-shift room capacity threshold.")

    return {
        "morning": morning_batch,
        "afternoon": afternoon_batch,
        "unassigned": unassigned_batch,
        "stats": {
            "total_candidates": total_students,
            "morning_count": len(morning_batch),
            "afternoon_count": len(afternoon_batch),
            "unassigned_count": len(unassigned_batch)
        }
    }