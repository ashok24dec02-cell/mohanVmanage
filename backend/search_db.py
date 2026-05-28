import os
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
target_collections = ["Staff", "Classes", "staff_collection", "class_collection", "Admissions", "Students"]

dbs = client.list_database_names()
for db_name in dbs:
    db = client[db_name]
    for coll_name in db.list_collection_names():
        if any(target.lower() in coll_name.lower() for target in target_collections):
            count = db[coll_name].count_documents({})
            print(f"Found in {db_name}: {coll_name} | Count: {count}")
            if count > 0:
                print(f"  Sample: {db[coll_name].find_one()}")
