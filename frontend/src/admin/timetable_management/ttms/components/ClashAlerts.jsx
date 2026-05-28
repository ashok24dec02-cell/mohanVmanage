import React from 'react';
import { AlertCircle } from 'lucide-react';

const ClashAlerts = ({ errors }) => {
    if (!errors || errors.length === 0) return null;

    return (
        <div className="tt-alert tt-alert-clash">
            <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0', fontWeight: 900}}>
                <AlertCircle size={20} />
                AI Generation Conflicts
            </h3>
            <p style={{fontSize: '0.85rem', margin: '0 0 0.75rem 0', opacity: 0.8}}>The engine encountered some constraints while processing:</p>
            <ul style={{margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', lineHeight: '1.5'}}>
                {errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                ))}
            </ul>
        </div>
    );
};

export default ClashAlerts;
