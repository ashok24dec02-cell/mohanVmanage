from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
import jwt
import re
from django.conf import settings
from db import db
from bson import ObjectId
import datetime
import json

def get_tokens_for_student(student):
    payload = {
        'user_id': str(student.get('_id', '')),
        'student_id': student.get('student_id'),
        'role': 'student',
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
        'iat': datetime.datetime.utcnow()
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return {
        'refresh': token,
        'access': token,
    }

class StudentProfileView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def get(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            
            student = db.student_collection.find_one({'_id': ObjectId(user_id)})
            if not student:
                return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'student_id': student.get('student_id', ''),
                'name': student.get('name', ''),
                'username': student.get('username', ''),
                'grade': student.get('grade', ''),
                'status': student.get('status', '')
            })
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': 'Invalid token', 'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class StudentTimeTableView(APIView):
    authentication_classes = []
    
    def get(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            student = db.student_collection.find_one({'_id': ObjectId(user_id)})
            if not student:
                return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
                
            grade = student.get('grade') or student.get('class_name')
            section = student.get('section', '')
            
            timetable = None
            if grade and section:
                combined = f"{grade}{section}"
                timetable = db.timetable_collection.find_one({'class_name': combined, 'is_active': True})
                if not timetable:
                    timetable = db.timetable_collection.find_one({'class_name': f"{grade} - {section}", 'is_active': True})
            
            if not timetable and grade:
                timetable = db.timetable_collection.find_one({'class_name': grade, 'is_active': True})
            
            if not timetable and grade:
                # Use re.compile for regex matching (e.g. "4A", "4B" for grade "4")
                timetable = db.timetable_collection.find_one({'class_name': re.compile(f'^{re.escape(grade)}'), 'is_active': True})
                
            if not timetable:
                return Response({}, status=status.HTTP_200_OK)
                
            return Response(timetable.get('schedule', {}), status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Invalid token', 'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class StudentExamTimeTableView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            student = db.student_collection.find_one({'_id': ObjectId(user_id)})
            if not student:
                return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
                
            # If the exam documents don't have 'grade' field, fetch all, otherwise filter by student's grade
            grade = student.get('grade') or student.get('class_name')
            section = student.get('section', '')
            query = {}
            if grade and db.exam_timetable_collection.count_documents({'grade': {'$exists': True}}) > 0:
                # Match exams where grade starts with student's grade
                # e.g. student grade='4' matches exam grades '4A','4B','4C'
                # student grade='10' matches '10A','10B','10C'
                if section:
                    # If student has a section, match exact grade+section first
                    query['grade'] = {'$in': [grade, f"{grade}{section}"]}
                else:
                    # No section — use regex to match all sections of this grade
                    query['grade'] = re.compile(f'^{re.escape(grade)}')
                
            exam_timetables = list(db.exam_timetable_collection.find(query))
            result = []
            for et in exam_timetables:
                et['_id'] = str(et['_id'])
                # Map supervisor keys to match frontend expectations
                if 'supervisors' in et and isinstance(et['supervisors'], list):
                    mapped_sups = []
                    for sup in et['supervisors']:
                        mapped_sups.append({
                            'name': sup.get('staffName', sup.get('name', '')),
                            'startTime': sup.get('shiftStart', sup.get('startTime', '')),
                            'endTime': sup.get('shiftEnd', sup.get('endTime', ''))
                        })
                    et['supervisors'] = mapped_sups
                result.append(et)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Invalid token', 'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class StudentHomeworkView(APIView):
    authentication_classes = []
    
    def get(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            student = db.student_collection.find_one({'_id': ObjectId(user_id)})
            if not student:
                return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
            
            homeworks = list(db.homework_collection.find({'student_id': student.get('student_id')}))
            
            if not homeworks:
                homeworks = []
            
            hw_list = []
            for hw in homeworks:
                hw_list.append({
                    'id': str(hw['_id']),
                    'title': hw.get('title', ''),
                    'subject': hw.get('subject', 'General'),
                    'description': hw.get('description', ''),
                    'due_date': str(hw.get('due_date', '')),
                    'status': hw.get('status', 'Pending')
                })
            return Response(hw_list, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Invalid token', 'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class StudentHomeworkUploadView(APIView):
    authentication_classes = []
    
    def post(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        hw_id = request.data.get('homework_id')
        try:
            if ObjectId.is_valid(hw_id):
                query = {'_id': ObjectId(hw_id)}
            else:
                query = {'_id': hw_id}
                
            db.homework_collection.update_one(
                query,
                {'$set': {'status': 'Submitted'}}
            )
            return Response({'success': True, 'message': 'Homework submitted successfully!'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StudentExamMarksView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            student = db.student_collection.find_one({'_id': ObjectId(user_id)})
            if not student:
                return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
                
            marks_doc = db.exam_marks_collection.find_one({'student_id': student.get('student_id')})
            if not marks_doc:
                return Response({}, status=status.HTTP_200_OK)
                
            return Response(marks_doc.get('marks_data', {}), status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Invalid token', 'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class StudentPerformanceView(APIView):
    authentication_classes = []
    
    def get(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            student = db.student_collection.find_one({'_id': ObjectId(user_id)})
            if not student:
                return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
                
            performance = db.performance_collection.find_one({'student_id': student.get('student_id')})
            if not performance:
                return Response({
                    'overall_percentage': 0,
                    'overall_grade': '-',
                    'rank': '-',
                    'total_students': 0,
                    'history': []
                }, status=status.HTTP_200_OK)
                
            performance['_id'] = str(performance['_id'])
            return Response(performance, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Invalid token', 'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class StudentDrugDetectionView(APIView):
    authentication_classes = []
    
    def get(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            student = db.student_collection.find_one({'_id': ObjectId(user_id)})
            if not student:
                return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
                
            reports = list(db.drug_detection_collection.find({'student_id': student.get('student_id')}))
            result = []
            for r in reports:
                r['_id'] = str(r['_id'])
                result.append(r)
                
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Invalid token', 'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class StudentDashboardSummaryView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
            token = auth_header.split(' ')[1]
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
                student = db.student_collection.find_one({'_id': ObjectId(user_id)})
                if not student:
                    return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

            pending_hw_count = db.homework_collection.count_documents({
                'student_id': student.get('student_id'),
                'status': 'Pending'
            })
            
            summary_data = {
                'stats': [
                    {'label': 'Attendance', 'value': '-', 'color': 'blue'},
                    {'label': 'Avg Grade', 'value': '-', 'color': 'indigo'},
                    {'label': 'Homeworks', 'value': f'{pending_hw_count} Pending', 'color': 'emerald'},
                    {'label': 'Exams', 'value': '-', 'color': 'orange'}
                ],
                'recent_schedule': [],
                'recent_homework': [],
                'recent_marks': []
            }
            
            recent_hw = list(db.homework_collection.find(
                {'student_id': student.get('student_id')}
            ).sort('_id', -1).limit(3))
            
            for hw in recent_hw:
                summary_data['recent_homework'].append({
                    'subject': hw.get('subject', ''),
                    'task': hw.get('title', ''),
                    'deadline': hw.get('due_date', '')
                })
                
            return Response(summary_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Internal server error', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

