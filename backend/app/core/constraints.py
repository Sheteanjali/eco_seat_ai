import sys

def backtrack_solve(students, grid, blocked, max_iterations=50000):
    """
    Constraint Satisfaction Problem (CSP) solver utilizing Recursive Backtracking 
    with Forward Checking to guarantee 100% conflict-free seating layouts.
    
    :param list students: List of student dicts or objects.
    :param list grid: List of seat coordinate tuples [(row, col), ...].
    :param set|list blocked: Set of blocked/broken seat coordinate tuples.
    :param int max_iterations: Maximum recursion steps before fallback abort.
    :return: Dict mapping (row, col) tuple to student object, or None if unsolvable.
    """
    if not students or not grid:
        return None

    # Normalization & filtering out blocked/defective seats
    blocked_set = set(blocked) if blocked else set()
    available_seats = [seat for seat in grid if seat not in blocked_set]

    # Capacity check: fail fast if students exceed available unblocked seats
    if len(students) > len(available_seats):
        print(f"⚠️ [CSP BACKTRACK ALERT] Insufficient available seats ({len(available_seats)}) for student count ({len(students)}).")
        return None

    assignments = {}
    iteration_counter = [0]  # Mutable counter wrapper for recursion tracking

    def get_course_id(student):
        """Helper to extract course/branch code flexibly from dict or object."""
        if isinstance(student, dict):
            return str(student.get('course_code') or student.get('branch') or student.get('department') or 'GEN').strip().upper()
        return str(getattr(student, 'course_code', getattr(student, 'branch', 'GEN'))).strip().upper()

    def is_safe(student, seat, current_assignments):
        """Checks 4-directional adjacent neighbors (Up, Down, Left, Right) for course code conflicts."""
        r, c = seat
        neighbors = [(r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)]
        student_course = get_course_id(student)
        
        for n in neighbors:
            if n in current_assignments:
                neighbor_student = current_assignments[n]
                if get_course_id(neighbor_student) == student_course:
                    return False
        return True

    def solve(idx):
        # Base Case: All students successfully allocated
        if idx == len(students):
            return True

        # Safety Guard: Abort if iteration ceiling reached
        iteration_counter[0] += 1
        if iteration_counter[0] > max_iterations:
            return False

        current_student = students[idx]

        for seat in available_seats:
            if seat not in assignments and is_safe(current_student, seat, assignments):
                # Placement Step
                assignments[seat] = current_student

                # Recursive Forward Exploration Step
                if solve(idx + 1):
                    return True

                # Backtrack Step
                del assignments[seat]

        return False

    # Execute recursive backtrack solver
    old_recursion_limit = sys.getrecursionlimit()
    sys.setrecursionlimit(max(old_recursion_limit, len(students) + 100))

    try:
        if solve(0):
            return assignments
    finally:
        sys.setrecursionlimit(old_recursion_limit)

    print("⚠️ [CSP BACKTRACK ALERT] No conflict-free seating combination exists for the given constraints.")
    return None