from datetime import datetime

class AttendanceValidator:
    """
    Service layer responsible for validating incoming HTTP payloads for the 
    staff attendance module to ensure data integrity before it reaches MongoDB.
    """
    
    @staticmethod
    def validate_teacher_payload(payload):
        """
        Validates the payload required to mark teacher attendance.
        Returns: (is_valid: bool, error_message: str)
        """
        required_fields = ['employee_id', 'teacher_name', 'date', 'status']
        
        for field in required_fields:
            if not payload.get(field):
                return False, f"Missing required field: {field}"
                
        # Validate Enum statuses
        valid_statuses = ['PRESENT', 'ABSENT', 'LEAVE']
        if payload['status'] not in valid_statuses:
            return False, f"Invalid status. Must be one of: {valid_statuses}"
            
        # Validate date format (YYYY-MM-DD)
        try:
            datetime.strptime(payload['date'], "%Y-%m-%d")
        except ValueError:
            return False, "Invalid date format. Expected YYYY-MM-DD."
            
        return True, None
