from datetime import datetime, timedelta

def generate_daily_slots(settings):
    """
    Generates a continuous list of daily period slots based on school settings.
    Automatically excludes lunch and interval breaks, preventing periods from overlapping with them.
    
    Args:
        settings (dict): Dictionary containing school configuration.
    Returns:
        list: Array of dictionaries, each representing a valid class period.
    """
    try:
        # 1. Fetch values with robust defaults
        start_str = settings.get('start_time', '09:00')
        end_str = settings.get('end_time', '16:00')
        duration_mins = int(settings.get('period_duration', 45))
        
        # Break Configs
        m_after = int(settings.get('morning_interval_after_period', 2))
        m_dur = int(settings.get('morning_interval_duration', 15))
        
        l_after = int(settings.get('lunch_after_period', 4))
        l_dur = int(settings.get('lunch_duration', 45))
        
        e_after = int(settings.get('evening_interval_after_period', 6))
        e_dur = int(settings.get('evening_interval_duration', 15))

        time_format = "%H:%M"
        current_time = datetime.strptime(start_str, time_format)
        end_time = datetime.strptime(end_str, time_format)
        
        slots = []
        period_number = 1
        
        # 3. Block-based Calculation Loop
        while current_time < end_time:
            period_end = current_time + timedelta(minutes=duration_mins)
            
            # Stop if we run past school hours
            if period_end > end_time:
                break
                
            # Save the valid period
            slots.append({
                "period": period_number,
                "start": current_time.strftime(time_format),
                "end": period_end.strftime(time_format)
            })
            
            # Prepare for next period
            current_time = period_end
            
            # 4. Inject Breaks after specific periods
            if period_number == m_after:
                current_time += timedelta(minutes=m_dur)
            elif period_number == l_after:
                current_time += timedelta(minutes=l_dur)
            elif period_number == e_after:
                current_time += timedelta(minutes=e_dur)
                
            period_number += 1
            
        return slots
        
    except ValueError as e:
        raise ValueError(f"Time format error. Ensure times are in HH:MM format. Details: {str(e)}")
    except Exception as e:
        raise Exception(f"Failed to generate slots: {str(e)}")
