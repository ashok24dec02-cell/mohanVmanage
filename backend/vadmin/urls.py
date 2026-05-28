from django.urls import path
from .views import *
from .staff_views import *
from .class_views import *
from .timetable_api_views import *

urlpatterns = [
    path('admission/', AdmissionView.as_view(), name='admission'),
    path('approve/', ApproveAdmissionView.as_view(), name='approve-admission'),
    
    # Staff Management
    path('staff/', StaffListView.as_view(), name='staff-list'),
    path('staff/<str:pk>/', StaffDetailView.as_view(), name='staff-detail'),
    path('attendance/', StaffAttendanceView.as_view(), name='staff-attendance'),

    # Class Management
    path('classes/', ClassListView.as_view(), name='class-list'),
    path('classes/<str:pk>/', ClassDetailView.as_view(), name='class-detail'),

    # Timetable Engine
    path('timetable/', GetTimetableView.as_view(), name='get-timetable'),
    path('timetable/generate/', GenerateTimetableView.as_view(), name='generate-timetable'),
    path('school-settings/', SchoolSettingsView.as_view(), name='school-settings'),
    
    # Timetable Data Management
    path('teachers/', TeacherListCreateView.as_view(), name='teacher-list'),
    path('teachers/<str:pk>/', TeacherDetailView.as_view(), name='teacher-detail'),
    path('subjects/', SubjectListCreateView.as_view(), name='subject-list'),
    path('subjects/<str:pk>/', SubjectDetailView.as_view(), name='subject-detail'),
    path('tt-classes/', ClassListCreateView.as_view(), name='tt-class-list'),
    path('tt-classes/<str:pk>/', ClassDetailView.as_view(), name='tt-class-detail'),
]
