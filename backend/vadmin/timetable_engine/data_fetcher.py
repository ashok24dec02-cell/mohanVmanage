from db.db import timetable_teachers, timetable_subjects, timetable_classes, timetable_settings, staff_collection, class_collection

def fetch_school_data():
    """
    Fetches school data by merging Timetable-specific collections with 
    the Master ERP database (Staff & Classes).
    """
    try:
        # 1. Fetch Master Data from ERP collections
        master_classes = list(class_collection.find({}, {"_id": 0}))
        master_staff = list(staff_collection.find({}, {"_id": 0}))
        
        # 2. Extract unique subjects and teacher-subject mappings from Classes
        # The user says "subjects and which teachers handle them are in class db"
        extracted_subjects = {}
        teacher_subject_map = {} # teacher_name -> set of subjects
        
        for cls in master_classes:
            # We assume 'subjects' is a list in each class document: [{"subject_name": "...", "teacher_name": "...", "weekly_periods": 5}, ...]
            subjects_list = cls.get('subjects', [])
            for sub in subjects_list:
                s_name = sub.get('subject_name')
                t_name = sub.get('teacher_name')
                w_periods = int(sub.get('weekly_periods', 5))
                
                if s_name:
                    if s_name not in extracted_subjects:
                        extracted_subjects[s_name] = w_periods
                    
                    if t_name:
                        if t_name not in teacher_subject_map:
                            teacher_subject_map[t_name] = set()
                        teacher_subject_map[t_name].add(s_name)

        # 3. Build Final Teacher List
        # Combine master staff with subject expertise found in class db
        teachers = []
        for staff in master_staff:
            name = staff.get('fullName') or staff.get('name')
            if not name: continue
            
            # Get subjects this teacher handles from our mapping
            subjects_handled = list(teacher_subject_map.get(name, []))
            
            teachers.append({
                "teacher_name": name,
                "subjects": subjects_handled,
                "max_periods_per_day": int(staff.get('max_periods', 5)),
                "free_period_required": True
            })

        # 4. Build Final Subject List
        subjects = [{"subject_name": name, "weekly_periods": count} for name, count in extracted_subjects.items()]

        # 5. Build Final Class List
        classes = []
        for cls in master_classes:
            classes.append({
                "class_name": cls.get('class_name'),
                "section": cls.get('section', ''),
                "room_number": cls.get('room_number', 'TBA'),
                "incharge_teacher": cls.get('incharge_name', ''),
                "subjects": cls.get('subjects', [])
            })

        # 6. Fetch/Default Settings
        settings = timetable_settings.find_one({}, {"_id": 0})
        if not settings:
            settings = {
                "school_name": "V-Manage Default",
                "start_time": "09:00",
                "end_time": "16:00",
                "period_duration": 45,
                "morning_interval_after_period": 2,
                "morning_interval_duration": 15,
                "lunch_after_period": 4,
                "lunch_duration": 45,
                "evening_interval_after_period": 6,
                "evening_interval_duration": 15,
                "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
            }
            
        return {
            "teachers": teachers,
            "subjects": subjects,
            "classes": classes,
            "settings": settings
        }
        
    except Exception as e:
        raise Exception(f"Failed to fetch dataset from Master DB: {str(e)}")
