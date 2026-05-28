from db.db import db
from datetime import datetime

class DailyTimetableMerger:
    """
    Service layer responsible for merging the static Master Timetable 
    with dynamic daily Substitute Assignments.
    This preserves the original database timetable while delivering a 
    real-time updated JSON payload to the frontend!
    """
    
    @staticmethod
    def get_dynamic_daily_timetable(date_str):
        
        
        # 1. Fetch Master Timetables (Original state preserved)
        active_timetables = list(db['timetables'].find({"is_active": True}, {"_id": 0}))
        
        # 2. Fetch Today's Substitution History
        daily_subs = list(db['timetable_substitutions'].find({"date": date_str}, {"_id": 0}))
        
        # Build an O(1) hash map for ultra-fast lookup
        # Key format: "10th Grade-A_2" (Class_Period)
        sub_map = {}
        for sub in daily_subs:
            # We only override if an actual substitute was ASSIGNED
            if sub.get('status') == 'ASSIGNED' and sub.get('substitute_teacher'):
                key = f"{sub['class_name']}_{sub['period']}"
                sub_map[key] = {
                    "substitute": sub['substitute_teacher'],
                    "original": sub['absent_teacher']
                }
                
        # 3. Determine Day of the Week mathematically
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        day_of_week = dt.strftime("%A")
        
        # 4. Generate the Dynamic Output
        updated_timetables = []
        
        for tt in active_timetables:
            class_name_section = f"{tt.get('class_name')}-{tt.get('section', '')}".strip("-")
            
            # Extract just today's schedule from the master week
            today_schedule = tt.get('schedule', {}).get(day_of_week, [])
            
            dynamic_schedule = []
            
            for slot in today_schedule:
                period = slot.get('period')
                lookup_key = f"{class_name_section}_{period}"
                
                # Clone the slot to avoid modifying the cached dictionary
                dynamic_slot = dict(slot)
                
                # --- DYNAMIC OVERRIDE LOGIC ---
                if lookup_key in sub_map:
                    # Swap the teacher
                    dynamic_slot['teacher'] = sub_map[lookup_key]['substitute']
                    # Maintain history flags for UI rendering (e.g. Yellow highlighting)
                    dynamic_slot['is_substitute'] = True
                    dynamic_slot['original_teacher'] = sub_map[lookup_key]['original']
                else:
                    dynamic_slot['is_substitute'] = False
                    
                dynamic_schedule.append(dynamic_slot)
                
            updated_timetables.append({
                "class_name": tt.get('class_name'),
                "section": tt.get('section'),
                "day": day_of_week,
                "date": date_str,
                "schedule": dynamic_schedule
            })
            
        return updated_timetables
