from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from bson import ObjectId
from datetime import datetime
from db.db import timetable_teachers, timetable_classes, timetable_subjects, timetable_settings, timetables_collection
import logging
logger = logging.getLogger(__name__)

from .timetable_engine.slot_generator import generate_daily_slots
from .timetable_engine.data_fetcher import fetch_school_data
from .timetable_engine.timetable_generator import TimetableGenerator

"""
Purpose: Django API Interface for Timetable Generation

Exposes the generation logic to React.
"""

class GetTimetableView(APIView):
    def get(self, request):
        """ Fetch all currently active timetables for display. """
        try:
            cursor = timetables_collection.find({"is_active": True}, {"_id": 0})
            timetables = list(cursor)
            return Response({"timetables": timetables}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GenerateTimetableView(APIView):
    def post(self, request):
        """
        Master Endpoint for Automated Timetable Generation.
        Flow: Fetch Data -> Generate Slots -> Generate Timetable -> Validate -> Save to DB.
        """
        try:
            # Extract Custom Rules from Frontend
            min_free = int(request.data.get('minFreePeriods', 1))
            max_free = int(request.data.get('maxFreePeriods', 2))
            
            # 1. Fetch All School Data
            try:
                school_data = fetch_school_data()
                
                # VALIDATION: Ensure we have the minimum data to generate a schedule
                if not school_data.get('teachers'):
                    return Response({"error": "No teachers found. Please add teachers to the Timetable module first."}, status=status.HTTP_400_BAD_REQUEST)
                if not school_data.get('subjects'):
                    return Response({"error": "No subjects found. Please add subjects to the Timetable module first."}, status=status.HTTP_400_BAD_REQUEST)
                if not school_data.get('classes'):
                    return Response({"error": "No classes found. Please add classes to the Timetable module first."}, status=status.HTTP_400_BAD_REQUEST)
                    
            except Exception as data_error:
                return Response({"error": str(data_error)}, status=status.HTTP_400_BAD_REQUEST)
                
            # 2. Generate Time Slots
            daily_slots = generate_daily_slots(school_data["settings"])
            
            # 3. Generate Timetable (AI Engine)
            generator = TimetableGenerator(school_data, daily_slots, min_free=min_free, max_free=max_free)
            generation_result = generator.generate()
            timetables_data = generation_result.get("timetables", [])
            
            # 4. Final Validation Pass (Double-checking the AI)
            validation_errors = []
            teacher_tracker = {} # Track teacher assignments by (day, period)
            
            for class_tt in timetables_data:
                for day, slots in class_tt.get('schedule', {}).items():
                    for slot in slots:
                        t = slot.get('teacher')
                        if t and t != "Unassigned":
                            time_key = f"{day}_P{slot['period']}"
                            if time_key not in teacher_tracker:
                                teacher_tracker[time_key] = set()
                                
                            if t in teacher_tracker[time_key]:
                                validation_errors.append(f"Validation Clash: Teacher {t} is double-booked on {day} during Period {slot['period']}.")
                            else:
                                teacher_tracker[time_key].add(t)
                                
            # 5. Save Timetable to MongoDB (Only if validation passes)
            if not validation_errors:
                for class_tt in timetables_data:
                    class_name = class_tt.get('class_name')
                    section = class_tt.get('section', '')
                    
                    if not class_name:
                        continue
                        
                    # Deactivate old versions
                    timetables_collection.update_many(
                        {"class_name": class_name, "section": section, "is_active": True},
                        {"$set": {"is_active": False}}
                    )
                    
                    # Insert new active version
                    new_timetable_doc = {
                        "class_name": class_name,
                        "section": section,
                        "is_active": True,
                        "generated_at": datetime.utcnow(),
                        "schedule": class_tt.get('schedule', {})
                    }
                    timetables_collection.insert_one(new_timetable_doc)
            
            # Return final payload
            if validation_errors:
                return Response({
                    "message": "Timetable generated but failed final clash validation. Not saved.",
                    "clash_errors": validation_errors,
                    "timetables": timetables_data
                }, status=status.HTTP_409_CONFLICT)
                
            return Response({
                "message": "Timetable generated, validated, and saved successfully!",
                "clash_errors": [],
                "timetables": timetables_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SaveTimetableView(APIView):
    def post(self, request):
        """
        Saves the generated timetables into MongoDB.
        Uses class-wise storage and prevents duplicates by deactivating older versions.
        """
        try:
            timetables_data = request.data.get('timetables', [])
            
            if not timetables_data:
                return Response({"error": "No timetable data provided."}, status=status.HTTP_400_BAD_REQUEST)
                
            saved_count = 0
            
            for class_tt in timetables_data:
                class_name = class_tt.get('class_name')
                section = class_tt.get('section', '')
                
                if not class_name:
                    continue
                    
                # 1. Overwrite Support: Deactivate any currently active timetable for this exact class
                # This prevents duplicate active schedules without deleting history
                timetables_collection.update_many(
                    {"class_name": class_name, "section": section, "is_active": True},
                    {"$set": {"is_active": False}}
                )
                
                # 2. Prepare the new optimized class-wise document
                new_timetable_doc = {
                    "class_name": class_name,
                    "section": section,
                    "is_active": True,
                    "generated_at": datetime.utcnow(),
                    "schedule": class_tt.get('schedule', {})
                }
                
                # 3. Insert into MongoDB
                timetables_collection.insert_one(new_timetable_doc)
                saved_count += 1
                
            return Response({
                "message": "Timetables saved and published successfully!",
                "saved_classes_count": saved_count
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

logger = logging.getLogger(__name__)

class TeacherListCreateView(APIView):
    """
    Handles GET (list all) and POST (create) for Teachers.
    """
    def get(self, request):
        try:
            teachers = list(timetable_teachers.find())
            # Convert ObjectId to string for JSON serialization
            for teacher in teachers:
                teacher['_id'] = str(teacher['_id'])
            return Response(teachers, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching teachers: {e}")
            return Response({"error": "Failed to fetch teachers"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            data = request.data
            
            # Basic Validation
            required_fields = ['teacher_name', 'department', 'mobile_number']
            for field in required_fields:
                if field not in data:
                    return Response({"error": f"Field '{field}' is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Insert into MongoDB
            result = timetable_teachers.insert_one({
                "teacher_name": data.get('teacher_name'),
                "subjects": data.get('subjects', []),
                "department": data.get('department'),
                "mobile_number": data.get('mobile_number'),
                "max_periods_per_day": data.get('max_periods_per_day', 5),
                "free_period_required": data.get('free_period_required', True)
            })
            
            return Response({
                "message": "Teacher created successfully",
                "id": str(result.inserted_id)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating teacher: {e}")
            return Response({"error": "Failed to create teacher"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TeacherDetailView(APIView):
    """
    Handles GET (single), PUT (update), and DELETE for a specific Teacher.
    """
    def get(self, request, pk):
        try:
            teacher = timetable_teachers.find_one({"_id": ObjectId(pk)})
            if not teacher:
                return Response({"error": "Teacher not found"}, status=status.HTTP_404_NOT_FOUND)
            
            teacher['_id'] = str(teacher['_id'])
            return Response(teacher, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid ID format or server error"}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        try:
            data = request.data
            
            update_data = {
                "teacher_name": data.get('teacher_name'),
                "subjects": data.get('subjects'),
                "department": data.get('department'),
                "mobile_number": data.get('mobile_number'),
                "max_periods_per_day": data.get('max_periods_per_day'),
                "free_period_required": data.get('free_period_required')
            }
            
            # Remove None values to avoid overwriting with null
            update_data = {k: v for k, v in update_data.items() if v is not None}

            result = timetable_teachers.update_one(
                {"_id": ObjectId(pk)},
                {"$set": update_data}
            )

            if result.matched_count == 0:
                return Response({"error": "Teacher not found"}, status=status.HTTP_404_NOT_FOUND)

            return Response({"message": "Teacher updated successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            result = timetable_teachers.delete_one({"_id": ObjectId(pk)})
            
            if result.deleted_count == 0:
                return Response({"error": "Teacher not found"}, status=status.HTTP_404_NOT_FOUND)
                
            return Response({"message": "Teacher deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": "Invalid ID format"}, status=status.HTTP_400_BAD_REQUEST)

logger = logging.getLogger(__name__)

class SubjectListCreateView(APIView):
    """
    Handles GET (list all) and POST (create) for Subjects.
    """
    def get(self, request):
        try:
            subjects = list(timetable_subjects.find())
            for subject in subjects:
                subject['_id'] = str(subject['_id'])
            return Response(subjects, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching subjects: {e}")
            return Response({"error": "Failed to fetch subjects"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            data = request.data
            
            # Validation
            if not data.get('subject_name') or not data.get('subject_code'):
                return Response({"error": "subject_name and subject_code are required"}, status=status.HTTP_400_BAD_REQUEST)

            # Insert
            subject_data = {
                "subject_name": data.get('subject_name'),
                "subject_code": data.get('subject_code'),
                "weekly_periods": int(data.get('weekly_periods', 0))
            }
            
            result = timetable_subjects.insert_one(subject_data)
            return Response({
                "message": "Subject created successfully",
                "id": str(result.inserted_id)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating subject: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SubjectDetailView(APIView):
    """
    Handles GET, PUT, DELETE for a specific Subject.
    """
    def get(self, request, pk):
        try:
            subject = timetable_subjects.find_one({"_id": ObjectId(pk)})
            if not subject:
                return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)
            
            subject['_id'] = str(subject['_id'])
            return Response(subject, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Invalid ID format"}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        try:
            data = request.data
            
            update_data = {}
            if 'subject_name' in data: update_data['subject_name'] = data['subject_name']
            if 'subject_code' in data: update_data['subject_code'] = data['subject_code']
            if 'weekly_periods' in data: update_data['weekly_periods'] = int(data['weekly_periods'])

            result = timetable_subjects.update_one({"_id": ObjectId(pk)}, {"$set": update_data})
            
            if result.matched_count == 0:
                return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

            return Response({"message": "Subject updated successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            result = timetable_subjects.delete_one({"_id": ObjectId(pk)})
            if result.deleted_count == 0:
                return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return Response({"error": "Invalid ID format"}, status=status.HTTP_400_BAD_REQUEST)

logger = logging.getLogger(__name__)

class ClassListCreateView(APIView):
    """
    Handles GET (list all) and POST (create) for Classes.
    """
    def get(self, request):
        try:
            classes = list(timetable_classes.find())
            for cls in classes:
                cls['_id'] = str(cls['_id'])
            return Response(classes, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching classes: {e}")
            return Response({"error": "Failed to fetch classes"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            data = request.data
            
            # Validation
            if not data.get('class_name') or not data.get('section'):
                return Response({"error": "class_name and section are required"}, status=status.HTTP_400_BAD_REQUEST)

            # Insert
            class_data = {
                "class_name": data.get('class_name'),
                "section": data.get('section'),
                "incharge_teacher": data.get('incharge_teacher'),
                "room_number": data.get('room_number')
            }
            
            result = timetable_classes.insert_one(class_data)
            return Response({
                "message": "Class created successfully",
                "id": str(result.inserted_id)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating class: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ClassDetailView(APIView):
    """
    Handles GET, PUT, DELETE for a specific Class.
    """
    def get(self, request, pk):
        try:
            class_obj = timetable_classes.find_one({"_id": ObjectId(pk)})
            if not class_obj:
                return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
            
            class_obj['_id'] = str(class_obj['_id'])
            return Response(class_obj, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Invalid ID format"}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        try:
            data = request.data
            
            update_data = {}
            fields = ['class_name', 'section', 'incharge_teacher', 'room_number']
            for field in fields:
                if field in data:
                    update_data[field] = data[field]

            result = timetable_classes.update_one({"_id": ObjectId(pk)}, {"$set": update_data})
            
            if result.matched_count == 0:
                return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)

            return Response({"message": "Class updated successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            result = timetable_classes.delete_one({"_id": ObjectId(pk)})
            if result.deleted_count == 0:
                return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return Response({"error": "Invalid ID format"}, status=status.HTTP_400_BAD_REQUEST)

logger = logging.getLogger(__name__)

class SchoolSettingsView(APIView):
    """
    Handles GET (fetch settings) and POST/PUT (update settings) for School Settings.
    Since there's only one school settings document, we use a fixed identifier or just find_one.
    """
    def get(self, request):
        try:
            # Fetch the first (and only) settings document
            settings = timetable_settings.find_one({}, {'_id': 0})
            if not settings:
                # Return empty settings if not initialized
                return Response({}, status=status.HTTP_200_OK)
            return Response(settings, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching school settings: {e}")
            return Response({"error": "Failed to fetch settings"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """
        Updates or creates the school settings document (Upsert).
        """
        try:
            data = request.data
            
            # Validation (basic)
            if not data.get('school_name'):
                return Response({"error": "school_name is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Define the settings document
            settings_doc = {
                "school_name": data.get('school_name'),
                "start_time": data.get('start_time', '09:00'),
                "end_time": data.get('end_time', '16:00'),
                "period_duration": int(data.get('period_duration', 45)),
                
                # Granular Break Controls
                "morning_interval_after_period": int(data.get('morning_interval_after_period', 2)),
                "morning_interval_duration": int(data.get('morning_interval_duration', 15)),
                
                "lunch_after_period": int(data.get('lunch_after_period', 4)),
                "lunch_duration": int(data.get('lunch_duration', 45)),
                
                "evening_interval_after_period": int(data.get('evening_interval_after_period', 6)),
                "evening_interval_duration": int(data.get('evening_interval_duration', 15)),
                
                "working_days": data.get('working_days', ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
            }
            
            # Upsert logic: Update the first document found, or create it if none exists
            timetable_settings.update_one(
                {}, 
                {"$set": settings_doc}, 
                upsert=True
            )
            
            return Response({
                "message": "School settings updated successfully",
                "data": settings_doc
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error updating school settings: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class MarkTeacherAttendanceView(APIView):
    def post(self, request):
        """
        API Endpoint to mark attendance for a specific teacher on a specific date.
        
        SAMPLE REQUEST:
        {
            "employee_id": "EMP001",
            "teacher_name": "Dr. Alan Turing",
            "date": "2026-05-07",
            "status": "PRESENT",
            "in_time": "08:15",
            "out_time": "15:00",
            "remarks": "On time"
        }
        """
        try:
            payload = request.data
            
            # 1. Validate payload using strict schema rules
            is_valid, error_msg = AttendanceValidator.validate_teacher_payload(payload)
            if not is_valid:
                return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)
                
            # 2. Process via Manager (Handles Upserts/Duplicate Prevention)
            manager = AttendanceManager()
            result = manager.mark_teacher_attendance(
                employee_id=payload['employee_id'],
                teacher_name=payload['teacher_name'],
                date=payload['date'],
                status=payload['status'],
                in_time=payload.get('in_time'),
                out_time=payload.get('out_time'),
                remarks=payload.get('remarks', '')
            )
            
            return Response({
                "message": f"Attendance successfully {result['action']}", 
                "data": result
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetTeacherAttendanceView(APIView):
    def get(self, request):
        """
        API Endpoint to retrieve teacher attendance.
        Supports filtering by specific status, and auto-generates rich statistical summaries.
        """
        try:
            date_str = request.query_params.get('date')
            status_filter = request.query_params.get('status')
            
            if not date_str:
                return Response({"error": "Missing required query parameter: date"}, status=status.HTTP_400_BAD_REQUEST)
                
            manager = AttendanceManager()
            # The manager automatically uses the optimized MongoDB indexes we defined earlier!
            records = manager.get_teacher_attendance(date_str, status_filter)
            
            # If the frontend asked for a specific filter (e.g., ?status=ABSENT), just return that list.
            if status_filter:
                return Response({
                    "date": date_str,
                    "filter": status_filter.upper(),
                    "count": len(records),
                    "attendance": records
                }, status=status.HTTP_200_OK)
                
            # If no specific filter was provided, we build the Master Summary response!
            summary = {
                "total_records": len(records),
                "PRESENT": 0,
                "ABSENT": 0,
                "LEAVE": 0
            }
            
            categorized = {
                "present_teachers": [],
                "absent_teachers": [],
                "leave_teachers": []
            }
            
            for record in records:
                st = record.get("status")
                summary[st] = summary.get(st, 0) + 1
                
                if st == "PRESENT":
                    categorized["present_teachers"].append(record)
                elif st == "ABSENT":
                    categorized["absent_teachers"].append(record)
                elif st == "LEAVE":
                    categorized["leave_teachers"].append(record)
            
            return Response({
                "date": date_str,
                "summary": summary,
                "data": categorized
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GenerateSubstitutesView(APIView):
    def post(self, request):
        """
        API Endpoint to trigger the AI Substitute Allocation Engine for a given date.
        """
        try:
            date_str = request.data.get('date')
            if not date_str:
                return Response({"error": "Date is required."}, status=status.HTTP_400_BAD_REQUEST)
                
            # Engine Orchestration Trigger
            plan = SubstituteAllocator.generate_substitute_plan(date_str)
            
            return Response(plan, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SaveSubstitutesView(APIView):
    def post(self, request):
        """
        API Endpoint to bulk save AI-generated substitute assignments.
        """
        try:
            date_str = request.data.get('date')
            assignments = request.data.get('substitutions', [])
            
            if not date_str or not assignments:
                return Response({"error": "Date and substitutions array are required."}, status=status.HTTP_400_BAD_REQUEST)
                
            saved_count = SubstituteManager.save_bulk_assignments(assignments, date_str)
            
            return Response({
                "message": "Substitute assignments saved and published successfully.",
                "saved_count": saved_count
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UpdateSubstituteStatusView(APIView):
    def put(self, request):
        """
        API Endpoint to manually update an assignment status (e.g., mark COMPLETED).
        """
        try:
            date_str = request.data.get('date')
            period = request.data.get('period')
            class_name = request.data.get('class_name')
            new_status = request.data.get('status')
            
            if not all([date_str, period, class_name, new_status]):
                return Response({"error": "Missing required fields (date, period, class_name, status)."}, status=status.HTTP_400_BAD_REQUEST)
                
            success = SubstituteManager.update_assignment_status(date_str, period, class_name, new_status)
            
            if success:
                return Response({"message": f"Status successfully updated to {new_status}."}, status=status.HTTP_200_OK)
            return Response({"error": "Assignment record not found."}, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AutoSubstituteView(APIView):
    def post(self, request):
        """
        One-Click AI API: Detects absentees, finds free teachers, allocates substitutes,
        saves to MongoDB automatically, and returns the final updated substitution plan.
        """
        try:
            date_str = request.data.get('date')
            if not date_str:
                return Response({"error": "Date is required (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
                
            # 1. Execute AI Generation Pipeline
            plan = SubstituteAllocator.generate_substitute_plan(date_str)
            
            # 2. Automatically Save to MongoDB
            saved_count = 0
            if plan.get('substitutions'):
                saved_count = SubstituteManager.save_bulk_assignments(plan['substitutions'], date_str)
                
            # 3. Return the fully updated timetable/plan
            return Response({
                "message": "Auto-Substitution engine executed and saved successfully.",
                "date": date_str,
                "records_saved": saved_count,
                "updated_timetable": plan
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DynamicDailyTimetableView(APIView):
    def get(self, request):
        """
        API Endpoint to fetch the fully merged Master Timetable + Today's Substitutes.
        """
        try:
            date_str = request.query_params.get('date')
            if not date_str:
                return Response({"error": "Date is required (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
                
            merged_timetable = DailyTimetableMerger.get_dynamic_daily_timetable(date_str)
            
            return Response({
                "message": "Dynamically merged timetable generated successfully.",
                "date": date_str,
                "timetables": merged_timetable
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
