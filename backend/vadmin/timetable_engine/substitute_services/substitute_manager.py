from db.db import db
from datetime import datetime

class SubstituteManager:
    """
    Service layer responsible for interacting with the MongoDB `substitutions` collection.
    Handles bulk saving of AI output and manual status updates.
    """
    
    @staticmethod
    def save_bulk_assignments(assignments, date_str):
        """
        Saves a large array of substitute assignments to MongoDB.
        First, it clears all existing assignments for this date to prevent stale data
        (e.g., if a teacher was marked absent yesterday, but changed to present today).
        """
        
        collection = db['substitutions']
        
        # CRITICAL FIX: Clear old substitutions for this date before saving the new ones!
        collection.delete_many({"date": date_str})
        
        saved_count = 0
        
        if not assignments:
            return saved_count
            
        for record in assignments:
            # The exact unique constraint signature:
            query = {
                "date": date_str,
                "period": record['period'],
                "class_name": record['class']
            }
            
            # Auto-calculate status based on the AI engine's output
            sub_teacher = record.get('substitute')
            if sub_teacher and "UNRESOLVED" in str(sub_teacher):
                status_enum = "UNRESOLVED"
                sub_teacher = None
            else:
                status_enum = "ASSIGNED"
            
            update_payload = {
                "$set": {
                    "subject": record['subject'],
                    "absent_teacher": record['teacher'],
                    "substitute_teacher": sub_teacher,
                    "status": status_enum,
                    "updated_at": datetime.utcnow()
                },
                "$setOnInsert": {
                    "created_at": datetime.utcnow()
                }
            }
            
            # Upsert mathematically guarantees no duplicate rows
            result = collection.update_one(query, update_payload, upsert=True)
            if result.upserted_id or result.modified_count > 0:
                saved_count += 1
                
        return saved_count
        
    @staticmethod
    def update_assignment_status(date_str, period, class_name, new_status):
        """
        Allows an admin to manually override or complete an assignment status.
        """
        
        result = db['substitutions'].update_one(
            {"date": date_str, "period": period, "class_name": class_name},
            {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0
