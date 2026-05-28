from attendance.services.absent_detector import AbsentDetector
from .free_teacher_finder import FreeTeacherFinder
from .subject_matcher import SubjectMatcher
from .workload_balancer import WorkloadBalancer
from db.db import db
from datetime import datetime

class SubstituteAllocator:
    """
    The Master Engine! Orchestrates the AbsentDetector, FreeTeacherFinder, SubjectMatcher, 
    and WorkloadBalancer to automatically generate the optimal substitute timetable.
    """
    
    @staticmethod
    def generate_substitute_plan(date_str):
        
        
        # 1. Detect Absent Teacher Periods
        missing_periods = AbsentDetector.detect_missing_teachers(date_str)
        if not missing_periods:
            return {"message": "No absent teachers detected. No substitutions needed.", "substitutions": []}
            
        # 2. Find Free Teachers per period
        free_teachers_by_period = FreeTeacherFinder.get_free_teachers(date_str)
        
        # 3. Cache all teacher metadata
        all_teachers = list(db['timetable_teachers'].find({}, {"_id": 0}))
        
        # 4. Calculate Current Workloads from Timetable
        daily_workloads = {}
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        day_of_week = dt.strftime("%A")
        
        for class_tt in db['timetables'].find({"is_active": True}):
            for slot in class_tt.get('schedule', {}).get(day_of_week, []):
                t = slot.get('teacher')
                if t and t != "Unassigned":
                    daily_workloads[t] = daily_workloads.get(t, 0) + 1
                    
        # 4b. Calculate Substitute Counts for today (MongoDB Integration)
        daily_sub_counts = {}
        today_subs = list(db['timetable_substitutions'].find({"date": date_str}))
        for sub in today_subs:
            st = sub.get('substitute_teacher')
            if st and sub.get('status') == 'ASSIGNED':
                daily_sub_counts[st] = daily_sub_counts.get(st, 0) + 1
                # Also add the existing sub assignment to their total daily workload
                daily_workloads[st] = daily_workloads.get(st, 0) + 1
                    
        # 5. Core Automatic Allocation Loop
        substitutions = []
        
        for missing in missing_periods:
            period = missing['period']
            missing_subj = missing['subject']
            period_key = f"period_{period}"
            
            # Get pool of free teachers for this specific period
            free_teachers = free_teachers_by_period.get(period_key, [])
            
            if not free_teachers:
                substitutions.append({**missing, "substitute": "UNRESOLVED - No free teachers"})
                continue
                
            # Apply Priority Rules (Subject -> Dept -> Any Free)
            ranked_candidates = SubjectMatcher.rank_teachers(missing_subj, free_teachers, all_teachers)
            
            # Apply Constraints (Max Periods, Max Subs per day)
            best_substitute = WorkloadBalancer.get_eligible_teacher(
                ranked_candidates, daily_workloads, daily_sub_counts, all_teachers
            )
            
            if best_substitute:
                substitutions.append({**missing, "substitute": best_substitute})
                
                # CRITICAL: Dynamically update state to prevent double-booking or overloading
                # on the next loop iteration!
                daily_workloads[best_substitute] = daily_workloads.get(best_substitute, 0) + 1
                daily_sub_counts[best_substitute] = daily_sub_counts.get(best_substitute, 0) + 1
                free_teachers_by_period[period_key].remove(best_substitute)
            else:
                substitutions.append({**missing, "substitute": "UNRESOLVED - Workload Limits Reached"})
                
        return {
            "date": date_str,
            "total_substitutions": len(substitutions),
            "substitutions": substitutions
        }
