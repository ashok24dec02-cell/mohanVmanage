from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from bson import ObjectId
from werkzeug.security import generate_password_hash
import json

from db import db

def generate_custom_id(collection, prefix):
    count = collection.count_documents({})
    return f"{prefix}_{str(count + 1).zfill(4)}"

class AdmissionView(APIView):
    # ... (existing post and get methods)
    def post(self, request):
        try:
            data = dict(request.data)
            data['status'] = 'applied'
            result = db.admission_collection.insert_one(data)

            return Response({
                'status': True,
                'message': 'Admission submitted successfully!',
                'id': str(result.inserted_id)
            })

        except Exception as e:
            print(e)
            return Response({
                'status': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request):
        try:
            admissions = list(db.admission_collection.find())
            for admission in admissions:
                admission['_id'] = str(admission['_id'])
            
            return Response({
                'status': True,
                'data': admissions
            })
        except Exception as e:
            return Response({
                'status': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ApproveAdmissionView(APIView):

    def post(self, request):
        try:
            data = request.data
            action = data.get('action') # 'init_payment', 'confirm_payment', or 'finalize'
            application_id = data.get('application_id')

            if not application_id:
                return Response({'status': False, 'message': 'Application ID required'}, status=400)

            if action == 'init_approval':
                # Step 1: Generate Admission ID and set status to Pending Payment
                admission_id = generate_custom_id(db.admission_collection, "ADM")
                db.admission_collection.update_one(
                    {'_id': ObjectId(application_id)},
                    {'$set': {'status': 'Pending Payment', 'admission_id': admission_id}}
                )
                
                # Fetch student details for modal
                student = db.admission_collection.find_one({'_id': ObjectId(application_id)})
                student['_id'] = str(student['_id'])

                return Response({
                    'status': True,
                    'message': 'Approval initialized',
                    'admission_id': admission_id,
                    'student': student
                })

            elif action == 'finalize':
                # Step 6: Store data in all collections
                payment_details = data.get('payment_details')
                credentials = data.get('credentials')
                
                application = db.admission_collection.find_one({'_id': ObjectId(application_id)})
                if not application:
                    return Response({'status': False, 'message': 'Application not found'}, status=404)

                admission_id = application.get('admission_id')
                student_id = generate_custom_id(db.student_collection, "STU")
                parent_id = generate_custom_id(db.parent_collection, "PAR")

                # 1. Update Admission Collection
                db.admission_collection.update_one(
                    {'_id': ObjectId(application_id)},
                    {'$set': {
                        'status': 'Approved',
                        'student_id': student_id,
                        'parent_id': parent_id,
                        'approved_at': payment_details.get('payment_date')
                    }}
                )

                # 2. Create Student Record
                student_data = {
                    'student_id': student_id,
                    'admission_id': admission_id,
                    'name': f"{application.get('firstName')} {application.get('lastName')}",
                    'username': credentials.get('studentUsername'),
                    'password': generate_password_hash(credentials.get('studentPassword')),
                    'grade': application.get('applyingForGrade'),
                    'parent_id': parent_id,
                    'status': 'Active'
                }
                db.student_collection.insert_one(student_data)

                # 3. Create Parent Record
                parent_data = {
                    'parent_id': parent_id,
                    'name': application.get('fatherName'),
                    'phone': application.get('fatherPhone'),
                    'email': application.get('fatherEmail'),
                    'username': credentials.get('parentUsername'),
                    'password': generate_password_hash(credentials.get('parentPassword')),
                    'students': [student_id]
                }
                db.parent_collection.insert_one(parent_data)

                # 4. Create Fees Record
                fees_data = {
                    'admission_id': admission_id,
                    'student_id': student_id,
                    'amount_paid': payment_details.get('feesAmount'),
                    'payment_method': payment_details.get('paymentMethod'),
                    'reference_no': payment_details.get('referenceNo'),
                    'payment_date': payment_details.get('payment_date'),
                    'notes': payment_details.get('notes'),
                    'status': 'Payment Completed'
                }
                db.fees_collection.insert_one(fees_data)

                return Response({
                    'status': True,
                    'message': 'Admission Approved Successfully',
                    'ids': {
                        'admission_id': admission_id,
                        'student_id': student_id,
                        'parent_id': parent_id
                    }
                })

            return Response({'status': False, 'message': 'Invalid action'}, status=400)

        except Exception as e:
            print(f"Error in ApproveAdmission: {e}")
            return Response({'status': False, 'message': str(e)}, status=500)