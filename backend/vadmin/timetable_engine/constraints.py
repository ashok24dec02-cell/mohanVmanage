"""
Purpose: Hard and Soft Rules Definition

This file stores the weighting and logic for constraints.
- HARD Constraints (Must be met): No double booking, workload limits respected.
- SOFT Constraints (Nice to have): A teacher prefers the 1st period free, 
  or complex subjects (Math) should be scheduled before lunch.

If using a scoring system (like a Genetic Algorithm), this file assigns 
penalties for breaking soft constraints.
"""

def calculate_fitness_score(schedule):
    # Evaluates how "good" a generated timetable is
    score = 100
    # Deduct points for soft constraint violations
    return score
