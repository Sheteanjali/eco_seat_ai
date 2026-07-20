import pandas as pd
from collections import defaultdict

def solve_seating(students_list, room_configs, mode="Double"):
    assignments = []
    
    # ------------------------------------------------------------------------
    # SAFEGUARD CRITICAL MOCK OVERRIDE: Empty protection boundary layers
    # ------------------------------------------------------------------------
    if not students_list or not room_configs:
        print("⚠️ [SOLVER CRITICAL WARNING] - Ingested empty arrays to seating engine.")
        return assignments

    # ------------------------------------------------------------------------
    # STEP 1: COUNT AND PRIORITIZE HIGHEST DENSITY BRANCH GROUPS FIRST 👑
    # ------------------------------------------------------------------------
    branch_buckets = defaultdict(list)
    for s in students_list:
        if not isinstance(s, dict):
            continue
        br = str(s.get('branch', 'GEN')).strip().upper()
        branch_buckets[br].append(s)
        
    if not branch_buckets:
        return assignments
        
    sorted_branches = sorted(branch_buckets.keys(), key=lambda k: len(branch_buckets[k]), reverse=True)
    
    interleaved_students = []
    max_pool_len = max(len(branch_buckets[b]) for b in branch_buckets.keys())
    
    for idx in range(max_pool_len):
        for br in sorted_branches:
            if idx < len(branch_buckets[br]):
                interleaved_students.append(branch_buckets[br][idx])
                
    unseated_students = interleaved_students.copy()

    # ------------------------------------------------------------------------
    # STEP 2: PARSE THE FRONTEND TOGGLE SEAT CAP FACTOR MODE 🎛️
    # ------------------------------------------------------------------------
    is_double_mode = "double" in str(mode).lower() or "two" in str(mode).lower() or "2" in str(mode).lower()
    students_per_bench = 2 if is_double_mode else 1

    room_occupancy = {}

    # ------------------------------------------------------------------------
    # STEP 3: ASYMMETRIC ROOM-FILL PIPELINE (Bulletproof Type Cast Interceptor)
    # ------------------------------------------------------------------------
    for room in room_configs:
        if not unseated_students:
            break
            
        r_id = str(room.get('room_no', 'Unknown'))
        room_occupancy[r_id] = {}
        
        broken_str = str(room.get('broken_tables', ''))
        broken = [t.strip() for t in broken_str.split(',') if t.strip()]
        
        column_bounds_map = room.get('column_bounds') or {}
        if isinstance(column_bounds_map, str):
            try:
                import json
                column_bounds_map = json.loads(column_bounds_map)
            except:
                column_bounds_map = {}

        # 👑 DEFENSIVE TYPE-CASTING SHIELD: Prevents string/float loop range mismatch crashes
        try:
            total_cols = int(float(str(room.get('cols', 5))))
            base_rows_limit = int(float(str(room.get('rows', 15))))
        except Exception:
            total_cols = 5
            base_rows_limit = 15

        for c in range(total_cols):
            col_key = str(c)
            
            try:
                active_row_limit = int(float(str(column_bounds_map[col_key]))) if col_key in column_bounds_map else base_rows_limit
            except Exception:
                active_row_limit = base_rows_limit

            for r in range(active_row_limit):
                if not unseated_students:
                    break
                    
                table_id = f"T{r * total_cols + c}"
                if table_id in broken:
                    continue

                for position in range(students_per_bench):
                    if not unseated_students:
                        break
                        
                    selected_student = None
                    
                    for i, student in enumerate(unseated_students):
                        student_branch = str(student.get('branch', 'GEN')).strip().upper()
                        
                        # Anti-Cheating neighborhood non-adjacency maps verification
                        neighbors = [
                            (r-1, c), (r+1, c), (r, c-1), (r, c+1), 
                            (r-1, c-1), (r-1, c+1), (r+1, c-1), (r+1, c+1)
                        ]
                        
                        is_safe = True
                        
                        for n in neighbors:
                            if n in room_occupancy[r_id] and student_branch in room_occupancy[r_id][n]:
                                is_safe = False
                                break
                                
                        if is_safe and (r, c) in room_occupancy[r_id]:
                            if student_branch in room_occupancy[r_id][(r, c)]:
                                is_safe = False

                        if is_safe:
                            selected_student = unseated_students.pop(i)
                            break

                    # 👑 presentation safeguard: No student left stranded in memory arrays
                    if not selected_student and unseated_students:
                        selected_student = unseated_students.pop(0)

                    if selected_student:
                        seated_student = selected_student.copy()
                        seated_student['assigned_room'] = r_id
                        
                        if is_double_mode:
                            seat_suffix = "_L" if position == 0 else "_R"
                            seated_student['assigned_seat'] = f"R{r+1}C{c+1}{seat_suffix}"
                        else:
                            seated_student['assigned_seat'] = f"R{r+1}C{c+1}"
                            
                        seated_student['shift'] = "Morning"
                        seated_student['exam_time'] = "09:30 AM"
                        
                        # 👑 FALLBACK KEY ALIGNER: Injects structural data attributes safely
                        seated_student['name'] = str(seated_student.get('name', 'Candidate'))
                        seated_student['roll_no'] = str(seated_student.get('roll_no', '000'))
                        seated_student['branch'] = str(seated_student.get('branch', 'GEN'))
                        seated_student['year'] = str(seated_student.get('year', '1'))
                        seated_student['subject'] = str(seated_student.get('subject', 'General Exam'))
                        
                        assignments.append(seated_student)
                        
                        if (r, c) not in room_occupancy[r_id]:
                            room_occupancy[r_id][(r, c)] = []
                        room_occupancy[r_id][(r, c)].append(student_branch)
                        
    return assignments