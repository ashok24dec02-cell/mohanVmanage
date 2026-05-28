from django.urls import path
from . import views

urlpatterns = [
    path('vadminlogin/', views.vadminlogin, name='vadminlogin'),
]