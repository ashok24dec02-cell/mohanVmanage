from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from bson import ObjectId
from werkzeug.security import generate_password_hash
from datetime import datetime
from db import db
from .views import generate_custom_id

class StaffListView(APIView):
    def get(self, request):
        try:
            staff_type = request.query_params.get('type')
            query = {}
            if staff_type:
                query['staff_category_group'] = staff_type # facilities, cleaner, office
            
            staff_list = list(db.staff_collection.find(query))
            for staff in staff_list:
                staff['_id'] = str(staff['_id'])
            
            return Response({
                'status': True,
                'data': staff_list
            })
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=500)

    def post(self, request):
        try:
            data = request.data
            staff_type = data.get('staff_category_group', 'facilities')
            
            # Check for duplicate phone number
            if db.staff_collection.find_one({'phone': data.get('phone')}):
                return Response({'status': False, 'message': 'Staff with this phone number already exists'}, status=400)

            # Generate ID based on type
            prefix = "STF"
            if staff_type == 'cleaner': prefix = "CLN"
            elif staff_type == 'office': prefix = "OFF"
            
            data['staff_id'] = generate_custom_id(db.staff_collection, prefix)

            # Hash password
            if 'password' in data:
                data['password'] = generate_password_hash(data['password'])
                if 'confirmPassword' in data:
                    del data['confirmPassword']
            
            data['created_at'] = datetime.now()
            data['status'] = data.get('status', 'Active')
            
            result = db.staff_collection.insert_one(data)
            staff_id = str(result.inserted_id)

            # SYNC: If assigned as class teacher, update the class incharge
            class_name = data.get('classTeacher')
            if class_name:
                # Clear previous teacher of this class
                db.staff_collection.update_many(
                    {'classTeacher': class_name, '_id': {'$ne': ObjectId(staff_id)}},
                    {'$set': {'classTeacher': ''}}
                )
                # Update the class with new incharge
                db.class_collection.update_one(
                    {'class_name': class_name},
                    {'$set': {
                        'incharge_id': staff_id, 
                        'incharge_name': data.get('fullName'),
                        'staff_id': data.get('staff_id')
                    }}
                )

            return Response({
                'status': True,
                'message': 'Staff added successfully',
                'staff_id': data['staff_id']
            })
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=500)

class StaffDetailView(APIView):
    def get(self, request, pk):
        try:
            if not ObjectId.is_valid(pk):
                return Response({'status': False, 'message': 'Invalid ID format'}, status=status.HTTP_400_BAD_REQUEST)
            staff = db.staff_collection.find_one({'_id': ObjectId(pk)})
            if staff:
                staff['_id'] = str(staff['_id'])
                return Response({'status': True, 'data': staff})
            return Response({'status': False, 'message': 'Staff not found'}, status=404)
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=500)

    def put(self, request, pk):
        try:
            if not ObjectId.is_valid(pk):
                return Response({'status': False, 'message': 'Invalid ID format'}, status=status.HTTP_400_BAD_REQUEST)
            data = request.data
            if 'password' in data and data['password']:
                data['password'] = generate_password_hash(data['password'])
            
            # Check for duplicate phone number
            if 'phone' in data:
                existing = db.staff_collection.find_one({'phone': data['phone']})
                if existing and str(existing['_id']) != pk:
                    return Response({'status': False, 'message': 'Staff with this phone number already exists'}, status=400)

            # Get current staff data to check if classTeacher changed
            old_staff = db.staff_collection.find_one({'_id': ObjectId(pk)})
            old_class = old_staff.get('classTeacher') if old_staff else None
            new_class = data.get('classTeacher')

            # Remove _id from data to avoid immutable field error
            if '_id' in data:
                del data['_id']

            db.staff_collection.update_one(
                {'_id': ObjectId(pk)},
                {'$set': data}
            )

            # SYNC: If classTeacher changed
            if new_class != old_class:
                # If they were teaching an old class, clear that class's incharge
                if old_class:
                    db.class_collection.update_one(
                        {'class_name': old_class, 'incharge_id': pk},
                        {'$set': {'incharge_id': '', 'incharge_name': ''}}
                    )
                
                # If they are teaching a new class
                if new_class:
                    # Clear previous teacher of the NEW class
                    db.staff_collection.update_many(
                        {'classTeacher': new_class, '_id': {'$ne': ObjectId(pk)}},
                        {'$set': {'classTeacher': ''}}
                    )
                    # Update the new class with this staff as incharge
                    db.class_collection.update_one(
                        {'class_name': new_class},
                        {'$set': {
                            'incharge_id': pk, 
                            'incharge_name': data.get('fullName', old_staff.get('fullName')),
                            'staff_id': old_staff.get('staff_id')
                        }}
                    )

            return Response({'status': True, 'message': 'Staff updated successfully'})

        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=500)


    def delete(self, request, pk):
        try:
            if not ObjectId.is_valid(pk):
                return Response({'status': False, 'message': 'Invalid ID format'}, status=status.HTTP_400_BAD_REQUEST)
            # SYNC: Clear classTeacher from staff record before deleting
            staff = db.staff_collection.find_one({'_id': ObjectId(pk)})
            if staff and staff.get('classTeacher'):
                db.class_collection.update_one(
                    {'class_name': staff.get('classTeacher'), 'incharge_id': pk},
                    {'$set': {'incharge_id': '', 'incharge_name': '', 'staff_id': ''}}
                )

            db.staff_collection.delete_one({'_id': ObjectId(pk)})
            return Response({'status': True, 'message': 'Staff deleted successfully'})
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=500)

class StaffAttendanceView(APIView):
    def post(self, request):
        try:
            # Expected data: { staff_id: '...', date: '...', status: 'Present/Absent/Half Day/Leave' }
            data = request.data
            data['created_at'] = datetime.now()
            db.attendance_collection.insert_one(data)
            return Response({'status': True, 'message': 'Attendance recorded'})
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=500)

    def get(self, request):
        try:
            staff_id = request.query_params.get('staff_id')
            month = request.query_params.get('month') # Format: YYYY-MM
            
            query = {}
            if staff_id: query['staff_id'] = staff_id
            if month: query['date'] = {'$regex': f'^{month}'}
            
            attendance = list(db.attendance_collection.find(query))
            for record in attendance:
                record['_id'] = str(record['_id'])
                
            return Response({'status': True, 'data': attendance})
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=500)
