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