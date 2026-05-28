import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from db.db import timetable_teachers, timetable_classes, timetable_subjects

print(f"Teachers: {timetable_teachers.count_documents({})}")
print(f"Classes: {timetable_classes.count_documents({})}")
print(f"Subjects: {timetable_subjects.count_documents({})}")
