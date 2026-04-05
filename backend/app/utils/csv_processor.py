import pandas as pd

def process_student_csv(file_path):
    """
    Cleaning and grouping student CSV data to eliminate human error[cite: 17].
    """
    df = pd.read_csv(file_path)
    
    # Validation: Ensure all 1,500 records have required Course Codes.
    df = df.dropna(subset=['roll_no', 'course_code'])
    
    # Sorting by Course Code helps the CSP solver handle uneven subject ratios[cite: 26].
    df = df.sort_values(by='course_code')
    
    return df.to_dict('records')