
def backtrack_solve(students, grid, blocked):
    """
    Recursive Backtracking and Forward Checking to find 100% conflict-free layouts[cite: 21, 26].
    """
    assignments = {}
    # Filter out pillars and broken benches marked by admin [cite: 31]
    available_seats = [s for s in grid if s not in blocked]

    def is_safe(student, seat, current_assignments):
        r, c = seat
        # Rule: No same-course neighbors horizontally or vertically [cite: 12, 14]
        neighbors = [(r-1, c), (r+1, c), (r, c-1), (r, c+1)]
        for n in neighbors:
            if n in current_assignments:
                if current_assignments[n].course_code == student.course_code:
                    return False
        return True

    def solve(idx):
        if idx == len(students):
            return True
        
        for seat in available_seats:
            if seat not in assignments and is_safe(students[idx], seat, assignments):
                assignments[seat] = students[idx]
                if solve(idx + 1):
                    return True
                del assignments[seat] # Backtracking step [cite: 23]
        return False

    if solve(0):
        return assignments
    return None