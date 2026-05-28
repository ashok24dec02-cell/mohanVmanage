from db.db import db
from datetime import datetime

class AbsentDetector:
    """
    Service layer responsible for analyzing attendance records against the generated 
    AI Timetable to detect complex patterns, such as subject-specific absences or 
    teachers who missed their assigned periods.
    """
    
    @staticmethod
    def detect_missing_teachers(date_str):
        """
        Cross-references the active timetable for a specific date with the 
        teacher attendance logs to find periods where a teacher is absent but 
        was scheduled to teach.
        """
        
        
        # 1. Fetch absent/leave teachers for the target day
        missing_records = db.staff_attendance.find({
            "date": date_str,
            "status": {"$in": ["ABSENT", "LEAVE"]}
        })
        
        missing_teacher_names = {record['teacher_name'] for record in missing_records}
        
        # Fast exit: If no one is absent, there are no affected periods!
        if not missing_teacher_names:
            return []
            
        # 2. Determine Day of the Week mathematically
        # Example: '2026-05-07' -> 'Thursday'
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        day_of_week = dt.strftime("%A")
        
        # 3. Fetch Master Active Timetables
        active_timetables = db['timetables'].find({"is_active": True})
        
        affected_periods = []
        
        # 4. Cross-Reference Algorithm
        for class_tt in active_timetables:
            class_name_section = f"{class_tt.get('class_name')}-{class_tt.get('section', '')}".strip("-")
            schedule = class_tt.get('schedule', {})
            
            # Extract slots only for the relevant day
            day_slots = schedule.get(day_of_week, [])
            
            for slot in day_slots:
                assigned_teacher = slot.get('teacher')
                
                # Critical Match: The teacher assigned to this period is marked ABSENT today
                if assigned_teacher in missing_teacher_names:
                    affected_periods.append({
                        "teacher": assigned_teacher,
                        "class": class_name_section,
                        "period": slot.get('period'),
                        "subject": slot.get('subject')
                    })
                    
        # Sort results chronologically by period, then by teacher name
        affected_periods.sort(key=lambda x: (x['period'], x['teacher']))
        
        return affected_periods
