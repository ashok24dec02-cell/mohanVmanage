from django.urls import path
from .views import (
    StudentProfileView, StudentTimeTableView,
    StudentExamTimeTableView, StudentHomeworkView, StudentHomeworkUploadView,
    StudentExamMarksView, StudentPerformanceView, StudentDrugDetectionView,
    StudentDashboardSummaryView
)

# urlpatterns = [
#     path('signup/', StudentSignupView.as_view(), name='student-signup'),
#     path('login/', StudentLoginView.as_view(), name='student-login'),
# ]

urlpatterns = [
    path('profile/', StudentProfileView.as_view(), name='student-profile'),
    path('timetable/', StudentTimeTableView.as_view(), name='student-timetable'),
    path('exam-timetable/', StudentExamTimeTableView.as_view(), name='student-exam-timetable'),
    path('homework/', StudentHomeworkView.as_view(), name='student-homework'),
    path('homework/upload/', StudentHomeworkUploadView.as_view(), name='student-homework-upload'),
    path('exam-marks/', StudentExamMarksView.as_view(), name='student-exam-marks'),
    path('performance/', StudentPerformanceView.as_view(), name='student-performance'),
    path('drug-detection/', StudentDrugDetectionView.as_view(), name='student-drug-detection'),
    path('dashboard-summary/', StudentDashboardSummaryView.as_view(), name='student-dashboard-summary'),
]
