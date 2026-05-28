import React from 'react';

// Helper to parse time in both HH:MM format and AM/PM format
const parseTimeToMinutes = (t) => {
    if (!t) return 0;
    const parts = t.trim().split(/\s+/);
    const timeStr = parts[0];
    const modifier = parts[1] ? parts[1].toUpperCase() : null;
    
    let [h, m] = timeStr.split(':').map(Number);
    if (modifier === 'PM' && h !== 12) h += 12;
    if (modifier === 'AM' && h === 12) h = 0;
    return h * 60 + m;
};

// Helper to match exam grade to class selection
const isGradeMatching = (examGrade, selectedEntity) => {
    if (!examGrade || !selectedEntity) return false;
    const cleanExam = examGrade.replace(/[\s-]/g, '').toLowerCase();
    const cleanEntity = selectedEntity.replace(/[\s-]/g, '').toLowerCase();
    return cleanExam === cleanEntity || cleanEntity.startsWith(cleanExam) || cleanExam.startsWith(cleanEntity);
};

const TimetableGrid = ({ schedule, selectedDay, masterPeriods, weekDates, examData, selectedEntity }) => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const activeDays = selectedDay === 'All' ? daysOfWeek : [selectedDay];
    
    // Sort periods dynamically based on the master periods list to ensure columns render correctly
    const periods = [...masterPeriods].sort((a, b) => a.period - b.period);

    return (
        <div className="tt-grid-wrapper">
            <table className="tt-table">
                <thead>
                    <tr>
                        <th className="tt-day-cell tt-header-cell">Day / Period</th>
                        {periods.map(p => (
                            <th key={p.period} className="tt-header-cell">
                                <div className="tt-period-title">Period {p.period}</div>
                                <div className="tt-period-time">{p.start_time} - {p.end_time}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {activeDays.map(day => {
                        const dayDateObj = weekDates?.find(w => w.name === day);
                        const dayDate = dayDateObj?.dateStr;
                        
                        const dayExams = (examData && dayDate) ? examData.filter(exam => 
                            exam.exam_date === dayDate && isGradeMatching(exam.grade, selectedEntity)
                        ) : [];

                        // We need to keep track of columns skipped due to colSpan
                        const skippedSlots = new Set();
 
                        return (
                            <tr key={day}>
                                <td className="tt-day-cell">
                                    <div className="font-bold">{day}</div>
                                    {dayDateObj && (
                                        <div className="text-[10px] text-slate-500 font-medium">{dayDateObj.display}</div>
                                    )}
                                </td>
                                {periods.map((p, pIdx) => {
                                    if (skippedSlots.has(p.period)) return null;
 
                                    const slotStart = parseTimeToMinutes(p.start_time);
                                    const slotEnd = parseTimeToMinutes(p.end_time);
 
                                    // Find which exam (if any) overlaps with this specific period
                                    const overlappingExam = dayExams.find(exam => {
                                        if (!exam.exam_time) return false;
                                        const times = exam.exam_time.split(' - ');
                                        if (times.length !== 2) return false;
                                        const examStartTime = parseTimeToMinutes(times[0]);
                                        const examEndTime = parseTimeToMinutes(times[1]);
                                        return slotStart < examEndTime && slotEnd > examStartTime;
                                    });
 
                                    if (overlappingExam) {
                                        // Calculate colSpan for this specific exam
                                        const times = overlappingExam.exam_time.split(' - ');
                                        const examStartTime = parseTimeToMinutes(times[0]);
                                        const examEndTime = parseTimeToMinutes(times[1]);

                                        let span = 0;
                                        for (let i = pIdx; i < periods.length; i++) {
                                            const nextP = periods[i];
                                            const nextStart = parseTimeToMinutes(nextP.start_time);
                                            const nextEnd = parseTimeToMinutes(nextP.end_time);
                                            if (nextStart < examEndTime && nextEnd > examStartTime) {
                                                span++;
                                                if (i > pIdx) skippedSlots.add(nextP.period);
                                            } else {
                                                break;
                                            }
                                        }
 
                                        return (
                                            <td key={p.period} colSpan={span} className="p-2 align-middle bg-red-50/50 dark:bg-red-950/20">
                                                <div className="h-full w-full border-2 border-dashed border-red-300 dark:border-red-800/80 rounded-xl flex flex-col items-center justify-center p-3 text-center min-h-[70px] bg-red-100/20">
                                                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">{overlappingExam.type} Exam</span>
                                                    <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{overlappingExam.subject}</span>
                                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{overlappingExam.exam_time} | Hall: {overlappingExam.hall}</span>
                                                    {overlappingExam.supervisor && overlappingExam.supervisor !== 'None' && (
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Invigilator: {overlappingExam.supervisor}</span>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    }

                                    // Find the specific slot for this day and period
                                    const slot = (schedule[day] || []).find(s => s.period === p.period);
                                    
                                    return (
                                        <td key={p.period}>
                                            {slot ? (
                                                <div className={`tt-subject-card ${slot.teacher === 'Unassigned' ? 'tt-unassigned' : ''}`}>
                                                    <span className="tt-subject-name">{slot.subject}</span>
                                                    <span className="tt-teacher-name">{slot.teacher}</span>
                                                    {slot.room && <span className="tt-room">Room {slot.room}</span>}
                                                </div>
                                            ) : (
                                                <div className="tt-free-cell">
                                                    Free
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default TimetableGrid;
