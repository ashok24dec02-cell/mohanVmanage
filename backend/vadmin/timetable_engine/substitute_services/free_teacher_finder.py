from db.db import db
from datetime import datetime

class FreeTeacherFinder:
    """
    Service layer responsible for calculating real-time teacher availability.
    Crucial for identifying eligible substitute teachers.
    """
    
    @staticmethod
    def get_free_teachers(date_str):
        """
        Determines which teachers are completely free for each period of the day.
        Excludes teachers who are actively teaching a class OR are marked absent today.
        
        Returns: Dict mapping period to list of available teacher names.
        Example: { 1: ["Ravi", "Kumar"], 2: ["Kumar"] }
        """
        
        
        # 1. Fetch Master List of all active teachers
        all_teachers_cursor = db['timetable_teachers'].find({}, {"_id": 0, "teacher_name": 1})
        all_teacher_names = {t['teacher_name'] for t in all_teachers_cursor}
        
        # 2. Exclude teachers who are ABSENT or on LEAVE today
        missing_records = db.staff_attendance.find({
            "date": date_str,
            "status": {"$in": ["ABSENT", "LEAVE"]}
        })
        absent_teachers = {record['teacher_name'] for record in missing_records}
        
        # Teachers actually physically present at school
        present_teachers = all_teacher_names - absent_teachers
        
        # 3. Determine Day of the Week
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        day_of_week = dt.strftime("%A")
        
        # 4. Initialize tracker for busy teachers per period
        busy_tracker = {} # Format: { period_number: set("Teacher A", "Teacher B") }
        
        active_timetables = list(db['timetables'].find({"is_active": True}))
        
        # Find the maximum number of periods in the school day to initialize our result dict
        max_period = 0
        
        # 5. Scan timetables to find who is teaching when
        for class_tt in active_timetables:
            schedule = class_tt.get('schedule', {})
            day_slots = schedule.get(day_of_week, [])
            
            for slot in day_slots:
                period = slot.get('period')
                teacher = slot.get('teacher')
                
                if period > max_period:
                    max_period = period
                    
                if teacher and teacher != "Unassigned":
                    if period not in busy_tracker:
                        busy_tracker[period] = set()
                    busy_tracker[period].add(teacher)
                    
        # 6. Calculate Free Teachers (Present - Busy)
        free_teachers_by_period = {}
        
        for period in range(1, max_period + 1):
            busy_this_period = busy_tracker.get(period, set())
            
            # A teacher is free if they are present today AND NOT busy this period
            free_teachers = present_teachers - busy_this_period
            
            period_key = f"period_{period}"
            # Sort alphabetically for clean UI rendering
            free_teachers_by_period[period_key] = sorted(list(free_teachers))
            
        return free_teachers_by_period
