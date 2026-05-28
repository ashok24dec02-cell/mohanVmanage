from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from bson import ObjectId
from db.db import exam_timetable_collection, timetables_collection, timetable_teachers, staff_collection
from datetime import datetime


class FreeTeachersView(APIView):
    """
    Returns teachers who are FREE during the given exam date + time slot.
    Checks against:
      1. Regular timetable (which day of the week does the exam_date fall on?)
      2. Other exams already scheduled at the same date+time
    """
    def get(self, request):
        try:
            exam_date = request.query_params.get('exam_date')  # YYYY-MM-DD
            start_time = request.query_params.get('start_time')  # HH:MM (24h)
            end_time = request.query_params.get('end_time')      # HH:MM (24h)

            if not exam_date or not start_time or not end_time:
                return Response({"error": "exam_date, start_time, and end_time are required"}, status=status.HTTP_400_BAD_REQUEST)

            # 1. Get all teachers from master staff collection
            all_teachers = list(staff_collection.find({}))
            all_teacher_names = [t.get('fullName') or t.get('name') for t in all_teachers]
            all_teacher_names = [name for name in all_teacher_names if name]

            # 2. Find which day of the week the exam falls on
            try:
                date_obj = datetime.strptime(exam_date, '%Y-%m-%d')
                day_name = date_obj.strftime('%A')  # Monday, Tuesday, etc.
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)

            # Parser that handles various format strings
            def parse_time_to_minutes(t_str):
                if not t_str:
                    return -1
                t_str = t_str.strip()
                for fmt in ('%I:%M %p', '%H:%M', '%I:%M%p', '%H:%M:%S'):
                    try:
                        dt = datetime.strptime(t_str, fmt)
                        return dt.hour * 60 + dt.minute
                    except ValueError:
                        continue
                return -1

            exam_start_min = parse_time_to_minutes(start_time)
            exam_end_min = parse_time_to_minutes(end_time)

            if exam_start_min == -1 or exam_end_min == -1:
                return Response({"error": "Invalid start_time or end_time format"}, status=status.HTTP_400_BAD_REQUEST)

            busy_teachers = set()

            # 3. Check regular timetable — find teachers busy on that day during overlapping periods
            active_timetables = list(timetables_collection.find({"is_active": True}))
            for tt in active_timetables:
                schedule = tt.get('schedule', {})
                day_slots = schedule.get(day_name, [])
                for slot in day_slots:
                    teacher = slot.get('teacher', '')
                    if not teacher or teacher == 'Unassigned' or teacher == 'Free Period':
                        continue

                    # Get start and end times from slot (direct or fallback to compound 'time' field)
                    s_min = -1
                    e_min = -1
                    if 'start_time' in slot and 'end_time' in slot:
                        s_min = parse_time_to_minutes(slot.get('start_time'))
                        e_min = parse_time_to_minutes(slot.get('end_time'))
                    
                    if (s_min == -1 or e_min == -1) and 'time' in slot:
                        slot_time = slot.get('time', '')
                        if ' - ' in slot_time:
                            parts = slot_time.split(' - ')
                            s_min = parse_time_to_minutes(parts[0])
                            e_min = parse_time_to_minutes(parts[1])

                    if s_min == -1 or e_min == -1:
                        continue

                    # Check overlap: two intervals overlap if start1 < end2 AND start2 < end1
                    if exam_start_min < e_min and s_min < exam_end_min:
                        busy_teachers.add(teacher)

            # 4. Check existing exam schedules for the same date with overlapping times
            same_day_exams = list(exam_timetable_collection.find({"exam_date": exam_date}))
            for exam in same_day_exams:
                exam_time_str = exam.get('exam_time', '')  # "09:30 AM - 12:30 PM"
                if ' - ' in exam_time_str:
                    parts = exam_time_str.split(' - ')
                    ex_start = parse_time_to_minutes(parts[0])
                    ex_end = parse_time_to_minutes(parts[1])

                    if ex_start == -1 or ex_end == -1:
                        continue

                    # Check overlap
                    if exam_start_min < ex_end and ex_start < exam_end_min:
                        # This exam overlaps — its supervisor is busy
                        supervisor = exam.get('supervisor', '')
                        if supervisor and supervisor != 'None':
                            busy_teachers.add(supervisor)
                        # Also check supervisors list
                        for sup in exam.get('supervisors', []):
                            if sup:
                                busy_teachers.add(sup)

            # 5. Filter: free = all_teachers - busy_teachers
            free_teachers = [name for name in all_teacher_names if name not in busy_teachers]

            return Response({
                "free_teachers": free_teachers,
                "busy_teachers": list(busy_teachers),
                "total_teachers": len(all_teacher_names),
                "day": day_name
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminExamTimetableView(APIView):
    def get(self, request):
        try:
            grade = request.query_params.get('grade')
            query = {}
            if grade:
                # Grade can be matched exactly, or support regex
                query['grade'] = grade
                
            exams = list(exam_timetable_collection.find(query))
            for exam in exams:
                exam['_id'] = str(exam['_id'])
            return Response(exams, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            data = request.data
            
            # Validation
            required_fields = ['type', 'subject', 'exam_date', 'exam_time', 'grade']
            for field in required_fields:
                if field not in data:
                    return Response({"error": f"Field '{field}' is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            exam_doc = {
                "type": data.get('type'),
                "subject": data.get('subject'),
                "exam_date": data.get('exam_date'),  # 'YYYY-MM-DD'
                "exam_time": data.get('exam_time'),  # '09:30 AM - 12:30 PM'
                "grade": data.get('grade'),
                "hall": data.get('hall', 'TBD'),
                "supervisor": data.get('supervisor', 'None'),
                "supervisors": data.get('supervisors', []),
                "benches": data.get('benches'),
                "students_per_bench": data.get('students_per_bench')
            }
            
            result = exam_timetable_collection.insert_one(exam_doc)
            exam_doc['_id'] = str(result.inserted_id)
            
            return Response({
                "message": "Exam timetable added successfully",
                "exam": exam_doc
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminExamTimetableDetailView(APIView):
    def put(self, request, pk):
        try:
            data = request.data
            update_data = {
                "type": data.get('type'),
                "subject": data.get('subject'),
                "exam_date": data.get('exam_date'),
                "exam_time": data.get('exam_time'),
                "grade": data.get('grade'),
                "hall": data.get('hall'),
                "supervisor": data.get('supervisor'),
                "supervisors": data.get('supervisors'),
                "benches": data.get('benches'),
                "students_per_bench": data.get('students_per_bench')
            }
            
            # filter None fields
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            result = exam_timetable_collection.update_one(
                {"_id": ObjectId(pk)},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)
                
            return Response({"message": "Exam timetable updated successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            result = exam_timetable_collection.delete_one({"_id": ObjectId(pk)})
            if result.deleted_count == 0:
                return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"message": "Exam timetable deleted successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
