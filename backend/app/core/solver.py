import pandas as pd
from collections import defaultdict

def solve_seating(students_list, room_configs, mode="Double"):
    assignments = []
    
    # ------------------------------------------------------------------------
    # STEP 1: COUNT AND PRIORITIZE HIGHEST DENSITY BRANCH GROUPS FIRST 👑
    # ------------------------------------------------------------------------
    branch_buckets = defaultdict(list)
    for s in students_list:
        # Normalize branch codes to handle lower/uppercase anomalies smoothly
        br = str(s.get('branch', 'GEN')).strip().upper()
        branch_buckets[br].append(s)
        
    # Sort branch identifiers based on who has the maximum candidate dataset count
    sorted_branches = sorted(branch_buckets.keys(), key=lambda k: len(branch_buckets[k]), reverse=True)
    
    # Interleave student records greedily to alternate branch sequences inside the master pool
    interleaved_students = []
    max_pool_len = max(len(branch_buckets[b]) for b in branch_buckets.keys()) if students_list else 0
    
    for idx in range(max_pool_len):
        for br in sorted_branches:
            if idx < len(branch_buckets[br]):
                interleaved_students.append(branch_buckets[br][idx])
                
    unseated_students = interleaved_students.copy()

    # ------------------------------------------------------------------------
    # STEP 2: PARSE THE FRONTEND TOGGLE SEAT CAP FACTOR MODE 🎛️
    # ------------------------------------------------------------------------
    # If Double/Two students per bench mode is active -> capacity factor scales to 2
    is_double_mode = "double" in str(mode).lower() or "two" in str(mode).lower() or "2" in str(mode).lower()
    students_per_bench = 2 if is_double_mode else 1

    # Main structural spatial trace memory layout to block conflict overlaps
    room_occupancy = {}

    # ------------------------------------------------------------------------
    # STEP 3: RE-ENGINEERED GREEDY ROOM-FILL PIPELINE (Zero Pre-mature Leaks)
    # ------------------------------------------------------------------------
    for room in room_configs:
        if not unseated_students:
            break
            
        r_id = str(room['room_no'])
        room_occupancy[r_id] = {}
        
        broken_str = str(room.get('broken_tables', ''))
        broken = [t.strip() for t in broken_str.split(',') if t.strip()]
        
        rows = int(room['rows'])
        cols = int(room['cols'])

        # Continuous spatial coordinate mapping loops
        for r in range(rows):
            for c in range(cols):
                if not unseated_students:
                    break
                    
                # Compute distinct alphanumeric label keys to filter structural infrastructure defects
                table_id = f"T{r * cols + c}"
                if table_id in broken:
                    continue

                # 👥 DUAL POSITION MATRIX COUPLING (Fills both slots of a bench before jumping columns)
                for position in range(students_per_bench):
                    if not unseated_students:
                        break
                        
                    selected_student = None
                    
                    # Traversal matching sequence scanner loop
                    for i, student in enumerate(unseated_students):
                        student_branch = student.get('branch', 'GEN').strip().upper()
                        
                        # Anti-Cheating non-adjacency constraint matrices check loop
                        # Look for neighboring boundaries: left, right, top, bottom, and diagonals
                        neighbors = [
                            (r-1, c), (r+1, c), (r, c-1), (r, c+1), 
                            (r-1, c-1), (r-1, c+1), (r+1, c-1), (r+1, c+1)
                        ]
                        
                        is_safe = True
                        
                        # Check branch overlaps with adjacent table coordinate arrays
                        for n in neighbors:
                            if n in room_occupancy[r_id] and room_occupancy[r_id][n] == student_branch:
                                is_safe = False
                                break
                                
                        # Check self table internal bench duplicate collisions for Double-Bench Mode
                        if is_safe and (r, c) in room_occupancy[r_id]:
                            # If another candidate is on this bench, their branch CANNOT match this student
                            if room_occupancy[r_id][(r, c)] == student_branch:
                                is_safe = False

                        if is_safe:
                            selected_student = unseated_students.pop(i)
                            break

                    # 🔄 Fallback Balance Handler: If strict criteria halts the sequence loop,
                    # safely allocate the student inside the room index instead of skipping or fracturing rooms
                    if not selected_student and unseated_students:
                        selected_student = unseated_students.pop(0)

                    if selected_student:
                        seated_student = selected_student.copy()
                        seated_student['assigned_room'] = r_id
                        
                        # Formatting final structural seat tags dynamically
                        if is_double_mode:
                            seat_suffix = "_L" if position == 0 else "_R"
                            seated_student['assigned_seat'] = f"R{r+1}C{c+1}{seat_suffix}"
                        else:
                            seated_student['assigned_seat'] = f"R{r+1}C{c+1}"
                            
                        # Keep session structures aligned to core RBU metrics
                        seated_student['shift'] = "Morning"
                        seated_student['exam_time'] = "09:30 AM"
                        
                        assignments.append(seated_student)
                        
                        # Lock current branch into spatial layout grid memory track
                        room_occupancy[r_id][(r, c)] = seated_student.get('branch', 'GEN').strip().upper()
                        
    return assignments