"""
Purpose: Master Controller for Timetable Generation

This file acts as the brain of the AI generation module. It takes the parsed data
(teachers, subjects, classes, settings) and orchestrates the generation process.
It initializes the grid, applies constraints, checks for clashes, and uses a solving 
algorithm (like Backtracking or a Genetic Algorithm) to build a complete, conflict-free schedule.
"""

import random

from .free_period_manager import FreePeriodManager

class TimetableGenerator:
    def __init__(self, school_data, daily_slots, min_free=1, max_free=2):
        self.teachers = school_data.get('teachers', [])
        self.classes = school_data.get('classes', [])
        self.subjects = school_data.get('subjects', [])
        self.settings = school_data.get('settings', {})
        self.daily_slots = daily_slots
        self.total_periods_per_day = len(self.daily_slots)
        
        self.min_free = min_free
        self.max_free = max_free
        
        # Working days default to standard week if not explicitly set
        self.working_days = self.settings.get('working_days', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
        self.total_slots_per_week = len(self.working_days) * self.total_periods_per_day
        
        # Final output structure
        self.timetable = {}
        
        # Tracking state to enforce rules
        self.teacher_busy_slots = self._init_teacher_tracking()
        self.class_to_subject_teacher = {} # (class_id, subject_name) -> teacher_name
        self.class_subject_needs = self._init_class_needs()
        self.subject_to_teachers = self._map_subjects_to_teachers()
        self.teacher_daily_counts = {} # Tracking assignments per day
        
        # Initialize Workload Manager
        self.workload_manager = FreePeriodManager(self.teachers, self.total_periods_per_day, self.min_free)

    def _init_teacher_tracking(self):
        """ Creates a lookup table to prevent double-booking teachers. """
        tracking = {}
        for day in self.working_days:
            tracking[day] = {slot['period']: set() for slot in self.daily_slots}
        return tracking
        
    def _init_class_needs(self):
        """ Tracks how many periods of each subject a class still needs this week. """
        needs = {}
        pt_teacher = self._find_pt_teacher()
        
        for cls in self.classes:
            class_id = f"{cls.get('class_name')} - {cls.get('section')}"
            class_needs = {}
            
            # 1. Collect existing subjects
            cls_subjects = cls.get('subjects', [])
            if cls_subjects:
                for sub in cls_subjects:
                    s_name = sub.get('subject_name')
                    w_periods = int(sub.get('weekly_periods', 5))
                    t_name = sub.get('teacher_name')
                    
                    if s_name:
                        class_needs[s_name] = w_periods
                        if t_name:
                            self.class_to_subject_teacher[(class_id, s_name)] = t_name
            else:
                # Fallback to global subjects list
                class_needs = {sub['subject_name']: sub['weekly_periods'] for sub in self.subjects}

            # 2. Ensure PT is present (2 periods per week)
            pt_subjects = ['PT', 'PHYSICAL TRAINING', 'PE', 'P.T.']
            has_pt = any(s.upper() in pt_subjects for s in class_needs.keys())
            
            if not has_pt:
                pt_key = "PT"
                class_needs[pt_key] = 2
                if pt_teacher:
                    self.class_to_subject_teacher[(class_id, pt_key)] = pt_teacher
            else:
                # If they have PT but it's not 2 periods, force it to 2 as per user request
                for s in list(class_needs.keys()):
                    if s.upper() in pt_subjects:
                        class_needs[s] = 2
                        if pt_teacher and (class_id, s) not in self.class_to_subject_teacher:
                            self.class_to_subject_teacher[(class_id, s)] = pt_teacher

            # 3. Fill Gaps (Eliminate Free Periods for Classes)
            total_current_periods = sum(class_needs.values())
            gap = self.total_slots_per_week - total_current_periods
            
            if gap > 0:
                # Distribute gap among existing non-PT subjects
                subjects_to_increase = [s for s in class_needs.keys() if s.upper() not in pt_subjects]
                if not subjects_to_increase: 
                    subjects_to_increase = list(class_needs.keys())
                
                if subjects_to_increase:
                    for i in range(gap):
                        target_sub = subjects_to_increase[i % len(subjects_to_increase)]
                        class_needs[target_sub] += 1
            
            needs[class_id] = class_needs
            
        return needs

    def _find_pt_teacher(self):
        """ Helper to find a teacher qualified for PT. """
        pt_terms = ['PT', 'PHYSICAL TRAINING', 'PE', 'P.T.']
        
        # Priority 1: Check if any teacher is already assigned to PT in any class
        for (cid, sname), tname in self.class_to_subject_teacher.items():
            if sname.upper() in pt_terms:
                return tname
                
        # Priority 2: Check global teacher expertise
        for teacher in self.teachers:
            expertise = [s.upper() for s in teacher.get('subjects', [])]
            if any(term in expertise for term in pt_terms):
                return teacher['teacher_name']
                
        return None

    def _map_subjects_to_teachers(self):
        """ Maps subjects to a list of teachers capable of teaching them. """
        mapping = {sub['subject_name']: [] for sub in self.subjects}
        for teacher in self.teachers:
            for sub in teacher.get('subjects', []):
                clean_sub = sub.strip()
                if clean_sub in mapping:
                    mapping[clean_sub].append(teacher['teacher_name'])
        return mapping

    def generate(self):
        """ Core Rule-Based Generation Logic (Weekly Extension). """
        
        # Iterate over every class to generate their specific timetable
        for cls in self.classes:
            class_id = f"{cls.get('class_name')} - {cls.get('section')}"
            self.timetable[class_id] = {day: [] for day in self.working_days}
            
            for day in self.working_days:
                subjects_assigned_today = {}
                last_assigned_subject = None
                
                for slot in self.daily_slots:
                    period_num = slot['period']
                    
                    # 1. Distribute Evenly: Sort subjects by remaining needed periods (descending)
                    # This ensures subjects with high weekly counts get priority
                    needed_subjects = [
                        (subj, count) 
                        for subj, count in self.class_subject_needs[class_id].items() 
                        if count > 0
                    ]
                    needed_subjects.sort(key=lambda x: x[1], reverse=True)
                    
                    assigned_subject = None
                    assigned_teacher = None
                    
                    # Pass A: Ideal Assignment (Subject not taught today at all)
                    for subj_name, needed in needed_subjects:
                        if subj_name not in subjects_assigned_today and subj_name != last_assigned_subject:
                            teacher = self._find_available_teacher(subj_name, day, period_num, class_id)
                            if teacher:
                                assigned_subject = subj_name
                                assigned_teacher = teacher
                                break
                    
                    # Pass B: Allow multiple periods per day, but strictly AVOID continuous/back-to-back
                    if not assigned_subject:
                        for subj_name, needed in needed_subjects:
                            if subj_name != last_assigned_subject:
                                teacher = self._find_available_teacher(subj_name, day, period_num, class_id)
                                if teacher:
                                    assigned_subject = subj_name
                                    assigned_teacher = teacher
                                    break
                                    
                    # Pass C: Fallback (Must assign back-to-back due to lack of other options)
                    if not assigned_subject:
                        for subj_name, needed in needed_subjects:
                            teacher = self._find_available_teacher(subj_name, day, period_num, class_id)
                            if teacher:
                                assigned_subject = subj_name
                                assigned_teacher = teacher
                                break
                                
                    # 3. Commit the assignment or create a fallback Study Period
                    if assigned_subject and assigned_teacher:
                        self.class_subject_needs[class_id][assigned_subject] -= 1
                        self.teacher_busy_slots[day][period_num].add(assigned_teacher)
                        
                        subjects_assigned_today[assigned_subject] = subjects_assigned_today.get(assigned_subject, 0) + 1
                        last_assigned_subject = assigned_subject
                        
                        # Register the assignment in the daily workload tracker
                        teacher_key = f"{assigned_teacher}_{day}"
                        self.teacher_daily_counts[teacher_key] = self.teacher_daily_counts.get(teacher_key, 0) + 1
                        
                        slot_data = {
                            "period": period_num,
                            "start_time": slot['start'],
                            "end_time": slot['end'],
                            "subject": assigned_subject,
                            "teacher": assigned_teacher,
                            "room": cls.get('room_number', 'TBA'),
                            "is_substitute": False
                        }
                    else:
                        # Prevent empty periods by assigning a generic free/study period
                        last_assigned_subject = "Study Period / Free"
                        slot_data = {
                            "period": period_num,
                            "start_time": slot['start'],
                            "end_time": slot['end'],
                            "subject": "Study Period / Free",
                            "teacher": "Unassigned",
                            "room": cls.get('room_number', 'TBA'),
                            "is_substitute": False
                        }
                        
                    self.timetable[class_id][day].append(slot_data)

        # 4. Format Output explicitly to match the required {"Monday": [], "Tuesday": []} object
        final_result = []
        for class_id, schedule in self.timetable.items():
            parts = class_id.split(' - ')
            final_result.append({
                "class_name": parts[0],
                "section": parts[1] if len(parts) > 1 else "",
                "schedule": schedule
            })
            
        return {
            "status": "success",
            "timetables": final_result
        }

    def _find_available_teacher(self, subj_name, day, period_num, class_id=None):
        """ Helper to find a non-clashing teacher who is under their workload limit. """
        
        # User Rule: If a specific teacher is assigned to this subject for this class, ONLY use them.
        assigned_teacher = None
        if class_id:
            assigned_teacher = self.class_to_subject_teacher.get((class_id, subj_name))
            
        if assigned_teacher:
            possible_teachers = [assigned_teacher]
        else:
            # Fallback to global mapping if no specific teacher is assigned to this class-subject pair
            possible_teachers = list(self.subject_to_teachers.get(subj_name, []))
        
        # Sort teachers by their current daily assigned count (ascending).
        # This guarantees teachers with the most free periods are picked FIRST.
        possible_teachers.sort(key=lambda t: self.teacher_daily_counts.get(f"{t}_{day}", 0))
        
        for teacher in possible_teachers:
            # Check 1: Is teacher busy at this exact time?
            if teacher not in self.teacher_busy_slots[day][period_num]:
                
                # Check 2: Will this violate their max periods or free period requirements?
                teacher_key = f"{teacher}_{day}"
                current_daily_count = self.teacher_daily_counts.get(teacher_key, 0)
                
                if self.workload_manager.can_assign_teacher(teacher, current_daily_count):
                    return teacher
                    
        return None
