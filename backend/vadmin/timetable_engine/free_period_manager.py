"""
Purpose: Teacher Workload & Rest Optimization

This file ensures that teachers get their required free periods and do not 
exceed their 'max_periods_per_day'. It prevents teacher burnout by acting
as a gatekeeper during the generation process.
"""

class FreePeriodManager:
    def __init__(self, teachers_data, total_periods_per_day, min_free=1):
        """
        Initializes the manager.
        teachers_data: List of teacher dictionaries from MongoDB.
        total_periods_per_day: Total number of timetable slots in a single day.
        min_free: Minimum number of free periods required.
        """
        self.teachers_config = {t['teacher_name']: t for t in teachers_data}
        self.total_periods = total_periods_per_day
        self.min_free = min_free
        
    def can_assign_teacher(self, teacher_name, daily_assigned_count):
        """
        Checks if assigning one more period to this teacher today will violate:
        1. Their personal max_periods_per_day limit.
        2. The fundamental minimum free period rule.
        """
        if not teacher_name or teacher_name == "Unassigned":
            return True
            
        config = self.teachers_config.get(teacher_name, {})
        
        # User Rule: Minimum free periods (dynamic). 
        # This means the absolute maximum periods they can teach is total_periods - min_free.
        absolute_max_periods = self.total_periods - self.min_free
        
        # User Rule: Maximum 2 free periods.
        # This implies a minimum teaching load of total_periods - 2, which will be 
        # enforced by the sorting algorithm in the generator, not here.
        
        # We take the stricter of their personal DB config or the new absolute rule
        db_max_periods = int(config.get('max_periods_per_day', 6))
        max_periods = min(db_max_periods, absolute_max_periods)
        
        # 1. Overload Check: Guarantee minimum 1 free period.
        if daily_assigned_count >= max_periods:
            return False
            
        return True
