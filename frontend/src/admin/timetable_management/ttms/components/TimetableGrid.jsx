import React from 'react';

const TimetableGrid = ({ schedule, selectedDay, masterPeriods }) => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const activeDays = selectedDay === 'All' ? daysOfWeek : [selectedDay];
    
    // Sort periods dynamically based on the master periods list to ensure columns render correctly
    const periods = [...masterPeriods].sort((a, b) => a.period - b.period);

    return (
        <div className="tt-grid-wrapper">
            <table className="tt-table">
                <thead>
                    <tr>
                        <th className="tt-day-cell">Day / Period</th>
                        {periods.map(p => (
                            <th key={p.period}>
                                <div>Period {p.period}</div>
                                <div style={{fontSize: '0.65rem', opacity: 0.7}}>({p.start_time} - {p.end_time})</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {activeDays.map(day => (
                        <tr key={day}>
                            <td className="tt-day-cell">
                                {day}
                            </td>
                            {periods.map(p => {
                                // Find the specific slot for this day and period
                                const slot = (schedule[day] || []).find(s => s.period === p.period);
                                
                                return (
                                    <td key={p.period}>
                                        {slot ? (
                                            <div className={`tt-subject-card ${slot.teacher === 'Unassigned' ? 'tt-unassigned' : ''}`}>
                                                <span className="tt-subject-name">{slot.subject}</span>
                                                <span className="tt-teacher-name">{slot.teacher}</span>
                                                {slot.room && <span style={{fontSize: '0.6rem', opacity: 0.6}}>Room {slot.room}</span>}
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
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TimetableGrid;
