from db.db import db
from datetime import datetime

class AttendanceManager:
    """
    Service layer responsible for interacting with the MongoDB `staff_attendance` collection.
    It isolates database logic from the API views.
    """
    def __init__(self):
        self.db = db
        self.collection = self.db['timetable_attendance']

    def mark_teacher_attendance(self, employee_id, teacher_name, date, status, in_time, out_time, remarks):
        """
        Inserts or updates the attendance record for a teacher on a given date.
        Uses MongoDB $setOnInsert to preserve original creation time during updates.
        """
        record = {
            "employee_id": employee_id,
            "teacher_name": teacher_name,
            "date": date,
            "status": status,
            "in_time": in_time,
            "out_time": out_time,
            "remarks": remarks,
            "updated_at": datetime.utcnow()
        }
        
        # Upsert: Update if (employee_id + date) exists, otherwise insert
        result = self.collection.update_one(
            {"employee_id": employee_id, "date": date},
            {
                "$set": record,
                "$setOnInsert": {"created_at": datetime.utcnow()}
            },
            upsert=True
        )
        
        return {
            "action": "updated" if result.modified_count > 0 else "created",
            "employee_id": employee_id,
            "status": status
        }

    def get_teacher_attendance(self, date, status=None):
        """
        Retrieves teacher attendance records for a specific date.
        Optionally filters by a specific status (e.g., 'ABSENT').
        """
        query = {"date": date}
        if status:
            query["status"] = status.upper()
            
        cursor = self.collection.find(query, {"_id": 0})
        return list(cursor)
