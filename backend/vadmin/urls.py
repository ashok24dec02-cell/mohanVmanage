from django.urls import path
from .views import *
from .staff_views import *
from .class_views import ClassListView as CoreClassListView, ClassDetailView as CoreClassDetailView
from .class_views import *
from .timetable_api_views import ClassListCreateView as TTClassListCreateView, ClassDetailView as TTClassDetailView
from .timetable_api_views import *
from .exam_timetable_views import *

urlpatterns = [
    path('admission/', AdmissionView.as_view(), name='admission'),
    path('approve/', ApproveAdmissionView.as_view(), name='approve-admission'),
    
    # Staff Management
    path('staff/', StaffListView.as_view(), name='staff-list'),
    path('staff/<str:pk>/', StaffDetailView.as_view(), name='staff-detail'),
    path('attendance/', StaffAttendanceView.as_view(), name='staff-attendance'),

    # Class Management
    path('classes/', CoreClassListView.as_view(), name='class-list'),
    path('classes/<str:pk>/', CoreClassDetailView.as_view(), name='class-detail'),

    # Timetable Engine
    path('timetable/', GetTimetableView.as_view(), name='get-timetable'),
    path('timetable/generate/', GenerateTimetableView.as_view(), name='generate-timetable'),
    path('school-settings/', SchoolSettingsView.as_view(), name='school-settings'),
    
    # Timetable Data Management
    path('teachers/', TeacherListCreateView.as_view(), name='teacher-list'),
    path('teachers/<str:pk>/', TeacherDetailView.as_view(), name='teacher-detail'),
    path('subjects/', SubjectListCreateView.as_view(), name='subject-list'),
    path('subjects/<str:pk>/', SubjectDetailView.as_view(), name='subject-detail'),
    path('tt-classes/', TTClassListCreateView.as_view(), name='tt-class-list'),
    path('tt-classes/<str:pk>/', TTClassDetailView.as_view(), name='tt-class-detail'),
    
    # Exam Timetable Management
    path('exam-timetable/', AdminExamTimetableView.as_view(), name='admin-exam-timetable'),
    path('exam-timetable/<str:pk>/', AdminExamTimetableDetailView.as_view(), name='admin-exam-timetable-detail'),
    path('free-teachers/', FreeTeachersView.as_view(), name='free-teachers'),
]
