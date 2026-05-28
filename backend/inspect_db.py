import os
import sys
from pymongo import MongoClient

# Extract URI from setting or hardcode if known
# Based on previous logs, it's Vmanage_V-1
client = MongoClient("mongodb://localhost:27017")
db = client["Vmanage_V-1"]

print("--- STAFF SAMPLE ---")
staff = db["Staff"].find_one()
print(staff)

print("\n--- CLASSES SAMPLE ---")
cls = db["Classes"].find_one()
print(cls)

print("\n--- SUBJECTS SAMPLE ---")
sub = db["timetable_subjects"].find_one()
print(sub)
