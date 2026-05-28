"""
Purpose: Conflict Avoidance System

This is the core rule-engine that prevents impossible schedules. 
It ensures the fundamental laws of physics are not broken.
It can be used both during generation and for validating manual UI edits.
"""
from datetime import datetime

class ClashDetector:
    
    @staticmethod
    def check_teacher_clash(teacher_name, day, period_index, current_schedule):
        """
        Ensures a teacher is not scheduled to teach two different classes at the exact same time.
        """
        if not teacher_name or teacher_name == "Unassigned":
            return {"has_clash": False, "message": ""}
            
        for class_id, schedule in current_schedule.items():
            daily_slots = schedule.get(day, [])
            for slot in daily_slots:
                if slot.get('period') == period_index and slot.get('teacher') == teacher_name:
                    return {
                        "has_clash": True, 
                        "message": f"Teacher Clash: {teacher_name} is already teaching {class_id} on {day} during period {period_index}."
                    }
                    
        return {"has_clash": False, "message": ""}

    @staticmethod
    def check_room_clash(room_number, day, period_index, current_schedule):
        """
        Ensures a physical classroom is not double-booked by two different classes simultaneously.
        """
        if not room_number or room_number == "TBA":
            return {"has_clash": False, "message": ""}
            
        for class_id, schedule in current_schedule.items():
            daily_slots = schedule.get(day, [])
            for slot in daily_slots:
                if slot.get('period') == period_index and slot.get('room') == room_number:
                    return {
                        "has_clash": True, 
                        "message": f"Room Clash: Room {room_number} is already occupied by {class_id} on {day} during period {period_index}."
                    }
                    
        return {"has_clash": False, "message": ""}
        
    @staticmethod
    def check_duplicate_subject_clash(subject_name, day, class_id, current_schedule, allow_multiple=True):
        """
        Ensures a class doesn't have the exact same subject back-to-back 
        (or twice on the same day depending on strictness).
        """
        if not subject_name or subject_name == "Study Period / Free":
            return {"has_clash": False, "message": ""}
            
        class_daily_slots = current_schedule.get(class_id, {}).get(day, [])
        
        # Check total count for the day
        subject_count = sum(1 for slot in class_daily_slots if slot.get('subject') == subject_name)
        if not allow_multiple and subject_count > 0:
             return {
                 "has_clash": True, 
                 "message": f"Duplicate Subject: {class_id} already has {subject_name} scheduled on {day}."
             }
             
        # Check for continuous back-to-back placement
        if len(class_daily_slots) > 0:
            last_slot = class_daily_slots[-1]
            if last_slot.get('subject') == subject_name:
                return {
                    "has_clash": True, 
                    "message": f"Continuous Subject Clash: {subject_name} is scheduled back-to-back for {class_id} on {day}."
                }
                
        return {"has_clash": False, "message": ""}
        
    @staticmethod
    def check_invalid_period_overlap(start_time_str, end_time_str, breaks):
        """
        Checks if a requested period time directly overlaps with a predefined break (lunch/interval).
        Breaks parameter should be a list: [{'start': '11:00', 'end': '11:15'}, ...]
        """
        if not breaks:
            return {"has_clash": False, "message": ""}
            
        time_format = "%H:%M"
        
        try:
            p_start = datetime.strptime(start_time_str, time_format)
            p_end = datetime.strptime(end_time_str, time_format)
            
            for b in breaks:
                b_start = datetime.strptime(b['start'], time_format)
                b_end = datetime.strptime(b['end'], time_format)
                
                # Core Overlap Logic: (StartA < EndB) and (EndA > StartB)
                if p_start < b_end and p_end > b_start:
                    return {
                        "has_clash": True,
                        "message": f"Period Overlap: Slot {start_time_str}-{end_time_str} overlaps with break {b['start']}-{b['end']}."
                    }
                    
            return {"has_clash": False, "message": ""}
            
        except ValueError:
            return {"has_clash": True, "message": "Invalid time format provided for overlap check. Expected HH:MM."}
            
    @staticmethod
    def validate_slot(slot_data, day, class_id, current_schedule, breaks=None):
        """
        Master validation function that runs all checks for a proposed slot assignment.
        Used primarily when a human administrator tries to manually edit a generated timetable.
        Returns the first clash found, or a success state.
        """
        breaks = breaks or []
        
        # 1. Check Period Overlap
        overlap_check = ClashDetector.check_invalid_period_overlap(slot_data.get('start_time'), slot_data.get('end_time'), breaks)
        if overlap_check['has_clash']: return overlap_check
        
        # 2. Check Teacher
        teacher_check = ClashDetector.check_teacher_clash(slot_data.get('teacher'), day, slot_data.get('period'), current_schedule)
        if teacher_check['has_clash']: return teacher_check
        
        # 3. Check Room
        room_check = ClashDetector.check_room_clash(slot_data.get('room'), day, slot_data.get('period'), current_schedule)
        if room_check['has_clash']: return room_check
        
        # 4. Check Subject Duplicate
        subj_check = ClashDetector.check_duplicate_subject_clash(slot_data.get('subject'), day, class_id, current_schedule)
        if subj_check['has_clash']: return subj_check
        
        return {"has_clash": False, "message": "Slot is valid and conflict-free."}
