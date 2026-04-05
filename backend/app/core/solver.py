def solve_seating(students_list, room_grid):
    """
    Stabilized Recursive Solver using Hashable Tuples.
    room_grid expected as: [ (room_no, (r, c)), ... ]
    """
    assignments = {} # Key: (room_no, (r, c)) -> Value: student_dict
    room_map = {}    # Quick lookup for neighbor checks

    for seat_tuple in room_grid:
        room_id, (r, c) = seat_tuple
        
        if room_id not in room_map:
            room_map[room_id] = {}

        # Neighbors: Up, Down, Left, Right
        neighbors = [(r-1, c), (r+1, c), (r, c-1), (r, c+1)]
        
        for student in students_list:
            # Skip if student already seated
            if any(s['roll_no'] == student['roll_no'] for s in assignments.values()):
                continue
            
            # Conflict Check
            is_safe = True
            for n_coord in neighbors:
                if n_coord in room_map[room_id]:
                    # Check course_code collision
                    if room_map[room_id][n_coord] == student.get('course_code'):
                        is_safe = False
                        break
            
            if is_safe:
                assignments[seat_tuple] = student
                room_map[room_id][(r, c)] = student.get('course_code')
                break
                
    return assignments