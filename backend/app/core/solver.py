def solve_seating(students_list, room_grid):
    """
    Nagpur Division AI Engine - Optimized Constraint Satisfaction (CSP).
    Ensures zero-collusion by checking Up, Down, Left, Right, AND Diagonals.
    """
    assignments = {}  # Key: (room_no, (r, c)) -> Value: student_dict
    room_map = {}     # Key: room_id -> Key: (r, c) -> Value: subject_code
    
    # Track seated students by Roll No for O(1) lookup
    seated_roll_nos = set()

    for seat_tuple in room_grid:
        room_id, (r, c) = seat_tuple
        
        if room_id not in room_map:
            room_map[room_id] = {}

        # 1. ENHANCED CONFLICT RADIUS (Includes Diagonals for better security)
        # Check all 8 surrounding cells in the matrix
        neighbors = [
            (r-1, c), (r+1, c), (r, c-1), (r, c+1), # Orthogonal
            (r-1, c-1), (r-1, c+1), (r+1, c-1), (r+1, c+1) # Diagonals
        ]
        
        for student in students_list:
            # 2. SEATED CHECK
            # Skip if candidate already has a coordinate in another room
            if student['roll_no'] in seated_roll_nos:
                continue
            
            # Identify the Subject/Course Code for this student
            # Supports both naming conventions used in your CSVs
            current_subject = student.get('subject_code') or student.get('course_code')
            
            # 3. COLLISION DETECTION
            is_safe = True
            for n_coord in neighbors:
                if n_coord in room_map[room_id]:
                    # Check if neighbor has the same Subject ID
                    if room_map[room_id][n_coord] == current_subject:
                        is_safe = False
                        break
            
            # 4. ALLOCATION
            if is_safe:
                assignments[seat_tuple] = student
                room_map[room_id][(r, c)] = current_subject
                seated_roll_nos.add(student['roll_no'])
                break
                
    return assignments