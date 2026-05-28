from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from werkzeug.security import check_password_hash
import json
from db import db


@csrf_exempt
def vadminlogin(request):

    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'message': 'Invalid request method'
        }, status=405)

    try:

        data = json.loads(request.body)

        username = data.get('username')
        password = data.get('password')

        # Check empty fields
        if not username or not password:
            return JsonResponse({
                'success': False,
                'message': 'Username and password required'
            }, status=400)

        # Find admin
        vadmin = db.vadmin_collection.find_one({
            'username': username
        })

        # Username not found
        if not vadmin:
            return JsonResponse({
                'success': False,
                'message': 'Invalid username'
            }, status=401)

        # Check password
        if not check_password_hash(vadmin['password'], password):
            return JsonResponse({
                'success': False,
                'message': 'Invalid password'
            }, status=401)

        return JsonResponse({
            'success': True,
            'message': 'Login successful',
            'admin_id': vadmin.get('admin_id'),
            'username': vadmin.get('username'),
            'name': vadmin.get('name')
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@csrf_exempt
def studentlogin(request):
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'message': 'Invalid request method'
        }, status=405)

    try:
        data = json.loads(request.body)
        identifier = data.get('username') or data.get('email_or_phone')
        password = data.get('password')

        if not identifier or not password:
            return JsonResponse({
                'success': False,
                'message': 'Username/Identifier and password required'
            }, status=400)

        # Find student by username
        student = db.student_collection.find_one({
            'username': identifier
        })

        if not student:
            return JsonResponse({
                'success': False,
                'message': 'Invalid credentials'
            }, status=401)

        # Check password (vadmin uses generate_password_hash from werkzeug.security)
        from werkzeug.security import check_password_hash
        
        is_valid = False
        try:
            is_valid = check_password_hash(student['password'], password)
        except:
            pass
        
        if not is_valid:
            if password == student.get('password'):
                is_valid = True
                
        if not is_valid:
            return JsonResponse({
                'success': False,
                'message': 'Invalid password'
            }, status=401)

        # In old code we generated JWT tokens
        import jwt
        import datetime
        from django.conf import settings
        
        payload = {
            'user_id': str(student['_id']),
            'student_id': student.get('student_id', ''),
            'role': 'student',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
            'iat': datetime.datetime.utcnow()
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

        return JsonResponse({
            'success': True,
            'message': 'Login successful',
            'tokens': {
                'access': token,
                'refresh': token
            },
            'student': {
                'student_id': student.get('student_id', ''),
                'email': student.get('email', ''),
                'phone_number': student.get('phone_number', '')
            }
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

