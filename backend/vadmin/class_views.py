from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from bson import ObjectId
from db import db

class ClassListView(APIView):
    def get(self, request):
        try:
            classes = list(db.class_collection.find())
            for cls in classes:
                cls['_id'] = str(cls['_id'])
            
            return Response({
                'status': True,
                'data': classes
            })
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=500)

    def post(self, request):
        try:
            data = request.data
            class_name = data.get('class_name')
            incharge_id = data.get('incharge_id')
            
            # Check for duplicate class name
            if db.class_collection.find_one({'class_name': class_name}):
                return Response({'status': False, 'message': f'Class {class_name} already exists'}, status=400)
            
            result = db.class_collection.insert_one(data)
            
            # SYNC: Update staff member's classTeacher field
            if incharge_id:
                # Clear previous class from this staff if any
                db.class_collection.update_many(
                    {'incharge_id': incharge_id, '_id': {'$ne': result.inserted_id}},
                    {'$set': {'incharge_id': '', 'incharge_name': ''}}
                )
                # Update staff
                if incharge_id and len(str(incharge_id)) == 24:
                    db.staff_collection.update_one(
                        {'_id': ObjectId(incharge_id)},
                        {'$set': {'classTeacher': class_name}}
                    )

            return Response({
                'status': True,
                'message': 'Class added successfully',
                'id': str(result.inserted_id)
            })
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=500)

class ClassDetailView(APIView):
    def get(self, request, pk):
        try:
            cls = db.class_collection.find_one({'_id': ObjectId(pk)})
            if cls:
                cls['_id'] = str(cls['_id'])
                return Response({'status': True, 'data': cls})
            return Response({'status': False, 'message': 'Class not found'}, status=404)
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=500)

    def put(self, request, pk):
        try:
            data = request.data
            class_name = data.get('class_name')
            new_incharge_id = data.get('incharge_id')
            
            # Check for duplicate class name (excluding current)
            existing = db.class_collection.find_one({'class_name': class_name})
            if existing and str(existing['_id']) != pk:
                return Response({'status': False, 'message': f'Class {class_name} already exists'}, status=400)
            
            # Get old data for sync
            old_class = db.class_collection.find_one({'_id': ObjectId(pk)})
            old_incharge_id = old_class.get('incharge_id') if old_class else None
            old_name = old_class.get('class_name') if old_class else None

            # Remove _id from data to avoid immutable field error
            if '_id' in data:
                del data['_id']

            db.class_collection.update_one(
                {'_id': ObjectId(pk)},
                {'$set': data}
            )

            # SYNC logic
            if new_incharge_id != old_incharge_id or class_name != old_name:
                # 1. Clear classTeacher from old incharge if they are no longer the incharge
                if old_incharge_id and len(str(old_incharge_id)) == 24:
                    db.staff_collection.update_one(
                        {'_id': ObjectId(old_incharge_id), 'classTeacher': old_name},
                        {'$set': {'classTeacher': ''}}
                    )
                
                # 2. Update new incharge with this class name
                if new_incharge_id:
                    # Clear any other class that might have this new incharge
                    db.class_collection.update_many(
                        {'incharge_id': new_incharge_id, '_id': {'$ne': ObjectId(pk)}},
                        {'$set': {'incharge_id': '', 'incharge_name': ''}}
                    )
                    # Set classTeacher for new incharge
                    if len(str(new_incharge_id)) == 24:
                        db.staff_collection.update_one(
                            {'_id': ObjectId(new_incharge_id)},
                            {'$set': {'classTeacher': class_name}}
                        )

            return Response({'status': True, 'message': 'Class updated successfully'})
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=500)


    def delete(self, request, pk):
        try:
            # SYNC: Clear classTeacher from staff record before deleting class
            cls = db.class_collection.find_one({'_id': ObjectId(pk)})
            if cls:
                db.staff_collection.update_many(
                    {'classTeacher': cls.get('class_name')},
                    {'$set': {'classTeacher': ''}}
                )

            db.class_collection.delete_one({'_id': ObjectId(pk)})
            return Response({'status': True, 'message': 'Class deleted successfully'})
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=500)
