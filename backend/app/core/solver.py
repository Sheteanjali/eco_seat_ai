import pandas as pd

def solve_seating(students_list, room_configs, mode="Double"):
    assignments = []
    seated_roll_nos = set()
    
    # RBU Shift Timings
    SHIFTS = [
        {"name": "Morning", "time": "09:30 AM"},
        {"name": "Afternoon", "time": "02:00 PM"}
    ]

    for session in SHIFTS:
        # Every shift gets a fresh room layout
        room_occupancy = {} 

        for room in room_configs:
            r_id = str(room['room_no'])
            room_occupancy[r_id] = {}
            
            # Infrastructure Check: Identify broken tables
            broken_str = str(room.get('broken_tables', ''))
            broken = [t.strip() for t in broken_str.split(',') if t.strip()]
            
            rows = int(room['rows'])
            cols = int(room['cols'])

            for r in range(rows):
                for c in range(cols):
                    # Policy: Single vs Double seating
                    if mode == "Single" and c % 2 != 0: continue
                    
                    # Safety: Skip broken infrastructure
                    table_id = f"T{r * cols + c}"
                    if table_id in broken: continue

                    # Find a student who isn't seated yet
                    for student in students_list:
                        roll = str(student.get('rollno') or student.get('roll_no'))
                        if roll in seated_roll_nos: continue
                        
                        group_id = student.get('paper_group_id', 'COMMON')
                        
                        # 8-Neighbor Conflict Check (Collusion Prevention)
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
                            # IMPORTANT: We create a copy to avoid overwriting shift data in the next pass
                            seated_student = student.copy()
                            seated_student['assigned_room'] = r_id
                            seated_student['assigned_seat'] = f"R{r+1}C{c+1}"
                            seated_student['shift'] = session['name']
                            seated_student['exam_time'] = session['time']
                            
                            assignments.append(seated_student)
                            room_occupancy[r_id][(r, c)] = group_id
                            seated_roll_nos.add(roll)
                            break
                            
    return assignments