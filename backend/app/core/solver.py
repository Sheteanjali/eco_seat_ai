import pandas as pd

def solve_seating(students_list, room_configs, mode="Double"):
    assignments = []
    # Students ko paper_group_id ke according organize karein fast access ke liye
    unseated_students = students_list.copy()
    
    # RBU Shift Timings
    SHIFTS = [
        {"name": "Morning", "time": "09:30 AM"},
        {"name": "Afternoon", "time": "02:00 PM"}
    ]

    for session in SHIFTS:
        if not unseated_students:
            break
            
        room_occupancy = {} 

        for room in room_configs:
            if not unseated_students:
                break
                
            r_id = str(room['room_no'])
            room_occupancy[r_id] = {}
            
            broken_str = str(room.get('broken_tables', ''))
            broken = [t.strip() for t in broken_str.split(',') if t.strip()]
            
            rows = int(room['rows'])
            cols = int(room['cols'])

            for r in range(rows):
                for c in range(cols):
                    if not unseated_students:
                        break

                    # Mode Logic
                    if mode == "Single" and c % 2 != 0: continue
                    
                    # Infrastructure Check
                    table_id = f"T{r * cols + c}"
                    if table_id in broken: continue

                    # Optimized Student Selection
                    selected_student = None
                    for i, student in enumerate(unseated_students):
                        group_id = student.get('paper_group_id', 'COMMON')
                        
                        # Neighbor Conflict Check
                        neighbors = [
                            (r-1, c), (r+1, c), (r, c-1), (r, c+1), 
                            (r-1, c-1), (r-1, c+1), (r+1, c-1), (r+1, c+1)
                        ]
                        
                        is_safe = True
                        for n in neighbors:
                            if n in room_occupancy[r_id] and room_occupancy[r_id][n] == group_id:
                                is_safe = False
                                break
                        
                        if is_safe:
                            selected_student = unseated_students.pop(i) # Use pop for O(1) seated check
                            break
                    
                    if selected_student:
                        seated_student = selected_student.copy()
                        seated_student['assigned_room'] = r_id
                        seated_student['assigned_seat'] = f"R{r+1}C{c+1}"
                        seated_student['shift'] = session['name']
                        seated_student['exam_time'] = session['time']
                        
                        assignments.append(seated_student)
                        room_occupancy[r_id][(r, c)] = seated_student.get('paper_group_id', 'COMMON')
                            
    return assignments