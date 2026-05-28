class WorkloadBalancer:
    """
    Service layer responsible for ensuring substitute assignments are distributed 
    fairly. It enforces the 'max_periods_per_day' limit for each teacher AND 
    a dedicated 'MAX_SUBSTITUTES_PER_DAY' threshold to prevent burnout.
    """
    
    # Configurable threshold: A teacher should ideally not be forced to 
    # take more than 2 extra substitute classes in a single day.
    MAX_SUBSTITUTES_PER_DAY = 2
    
    @classmethod
    def get_eligible_teacher(cls, ranked_teachers, daily_workloads, daily_sub_counts, all_teachers_data):
        """
        Scans the ranked list of candidates and returns the absolute best teacher
        who has NOT hit their total daily limit AND has not hit the substitution limit.
        
        daily_workloads: {'Teacher X': 4} (Total periods assigned today)
        daily_sub_counts: {'Teacher X': 1} (Substitute periods already assigned today)
        """
        teacher_dict = {t['teacher_name']: t for t in all_teachers_data}
        
        for candidate in ranked_teachers:
            name = candidate['teacher_name']
            t_data = teacher_dict.get(name)
            
            if not t_data:
                continue
                
            # 1. Check Absolute Maximum Allowed Periods for this teacher
            max_allowed = t_data.get('max_periods_per_day', 6)
            current_total_workload = daily_workloads.get(name, 0)
            
            # 2. Check Specific Substitute Count for today
            current_sub_count = daily_sub_counts.get(name, 0)
            
            # Constraint check: Avoid overload on both fronts
            if current_total_workload < max_allowed and current_sub_count < cls.MAX_SUBSTITUTES_PER_DAY:
                return name
                
        # If every single free teacher has hit their limit, return None
        return None
