class SubjectMatcher:
    """
    Service layer responsible for intelligently ranking available substitute teachers
    based on their subject expertise. Priority:
    1. Exact Subject Match (Score: 3)
    2. Same Department (Score: 2)
    3. Any Free Teacher (Score: 1)
    """
    
    # Department definitions for heuristic matching
    DEPARTMENTS = {
        "Science": ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science"],
        "Arts": ["English", "History", "Geography", "Art"],
        "PE": ["Physical Education"]
    }

    @classmethod
    def get_department(cls, subject_name):
        for dept, subjects in cls.DEPARTMENTS.items():
            if subject_name in subjects:
                return dept
        return "General"

    @classmethod
    def rank_teachers(cls, missing_subject, free_teacher_names, all_teachers_data):
        """
        Sorts the available teachers, prioritizing those who are qualified 
        to teach the missing subject.
        """
        missing_dept = cls.get_department(missing_subject)
        ranked = []
        
        # Create dictionary for O(1) fast lookup
        teacher_dict = {t['teacher_name']: t for t in all_teachers_data}
        
        for name in free_teacher_names:
            t_data = teacher_dict.get(name)
            if not t_data:
                continue
                
            teacher_subjects = t_data.get('subjects', [])
            score = 1 # Base priority: Any free teacher
            
            # Rule 1: Exact Match
            if missing_subject in teacher_subjects:
                score = 3 
            else:
                # Rule 2: Department Match (e.g., A Physics teacher substituting a Math class)
                for subj in teacher_subjects:
                    if cls.get_department(subj) == missing_dept:
                        score = 2
                        break
                        
            ranked.append({
                "teacher_name": name,
                "score": score
            })
            
        # Sort descending so the highest score (best match) is at index 0
        ranked.sort(key=lambda x: x['score'], reverse=True)
        return ranked
