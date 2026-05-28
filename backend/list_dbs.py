import os
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
# Let's list all databases first
dbs = client.list_database_names()
print(f"Databases: {dbs}")

for db_name in dbs:
    if db_name in ['admin', 'local', 'config']: continue
    print(f"\n--- Database: {db_name} ---")
    db = client[db_name]
    for coll in db.list_collection_names():
        count = db[coll].count_documents({})
        print(f"Collection: {coll} | Count: {count}")
        if count > 0:
            print(f"Sample: {db[coll].find_one()}")
