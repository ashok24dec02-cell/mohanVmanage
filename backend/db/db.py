from django.conf import settings
from mongoengine import connect, get_connection
from pymongo import MongoClient

# Use the connection from settings.py if it exists, otherwise connect
try:
    get_connection()
except:
    connect(db="Vmanage_V-1", host=settings.MONGO_URI)

client = MongoClient(settings.MONGO_URI)
db = client["Vmanage_V-1"]

# Collections
vadmin_collection = db["vadmin"]
admission_collection = db["Admissions"]
student_collection = db["Students"]
parent_collection = db["Parents"]
fees_collection = db["Fees"]
staff_collection = db["Staff"]
attendance_collection = db["Attendance"]
class_collection = db["Classes"]

# Timetable Collections
timetable_teachers = db["timetable_teachers"]
timetable_classes = db["timetable_classes"]
timetable_subjects = db["timetable_subjects"]
timetable_settings = db["timetable_settings"]
timetables_collection = db["timetables"]

# Student Portal Collections
timetable_collection = db["timetables"]
exam_timetable_collection = db["ExamTimeTable"]
homework_collection = db["Homework"]
exam_marks_collection = db["ExamMarks"]
performance_collection = db["Performance"]
drug_detection_collection = db["DrugDetection"]

