import './HomeworkDetails.css';
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import config from '../config';
import toast from 'react-hot-toast';

const HomeworkDetails = () => {
    const { subData: hwData, handleNavigate } = useOutletContext();
    const onBack = () => handleNavigate('Homework');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(hwData?.status || 'Pending');

    if (!hwData) {
        return (
            <div className="p-12 text-center">
                <p className="text-slate-500 font-bold">No homework data selected.</p>
                <button onClick={onBack} className="mt-4 text-blue-600 font-black hover:underline">Go Back</button>
            </div>
        );
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file to upload");
            return;
        }
        
        setUploading(true);
        try {
            const token = sessionStorage.getItem('studentToken');
            await axios.post(`${config.BASE_URL}/student/homework/upload/`, {
                homework_id: hwData.id,
                filename: file.name
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success("Homework submitted successfully!");
            setStatus("Submitted");
            setFile(null);
        } catch (err) {
            toast.error("Failed to submit homework.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="hw-details-container max-w-[900px] mx-auto p-4 md:p-6 w-full animate-fade-in">
            <button 
                onClick={onBack}
                className="hw-details-back-btn flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:white font-bold transition-colors mb-6"
            >
                <ArrowLeft size={16} />
                Back to Homework List
            </button>

            <div className="hw-details-card bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <div className="hw-details-header flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div>
                        <h2 className="hw-details-title text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{hwData.title}</h2>
                        <div className="hw-details-meta flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            <span>{hwData.subject}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5"><Clock size={12} /> Due: {hwData.due_date}</span>
                        </div>
                    </div>
                    
                    <div className={`hw-details-status-badge px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5 ${status.toLowerCase()}`}>
                        {status === 'Pending' ? <Clock size={14} /> : <CheckCircle size={14} />}
                        {status}
                    </div>
                </div>

                <div className="hw-details-description-section mb-8">
                    <h3 className="hw-details-section-title text-base font-extrabold text-slate-800 dark:text-slate-100 mb-3">Description</h3>
                    <p className="hw-details-description text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-100/80 dark:border-slate-800/80">{hwData.description}</p>
                </div>

                {status === 'Pending' ? (
                    <div className="hw-submit-card bg-blue-50/20 dark:bg-blue-900/5 p-6 rounded-2xl border border-blue-100/50 dark:border-blue-900/20 transition-all mt-6">
                        <h3 className="hw-submit-title text-lg font-extrabold text-blue-900 dark:text-blue-200 mb-4 flex items-center gap-2">
                            <Upload size={20} className="text-blue-600 dark:text-blue-400" />
                            Submit Assignment
                        </h3>
                        
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 w-full relative">
                                <input 
                                    type="file" 
                                    id="hw-upload" 
                                    className="hidden" 
                                    onChange={handleFileChange}
                                />
                                <label 
                                    htmlFor="hw-upload"
                                    className="hw-submit-dashed-box flex flex-col items-center justify-center gap-2.5 w-full bg-white dark:bg-slate-800/50 border-2 border-dashed border-blue-200/60 dark:border-blue-900/30 p-8 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all text-blue-600 dark:text-blue-400 font-bold"
                                >
                                    <FileText size={28} className="opacity-80" />
                                    <span className="text-sm font-bold">{file ? file.name : "Drag & drop or click to upload..."}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">Supports PDF, DOCX, ZIP up to 10MB</span>
                                </label>
                            </div>
                            <button 
                                onClick={handleUpload}
                                disabled={uploading || !file}
                                className="hw-submit-btn w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {uploading ? "Uploading..." : "Submit Work"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 text-center transition-colors">
                        <CheckCircle size={48} className="mx-auto text-emerald-500 dark:text-emerald-400 mb-4" />
                        <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-100 mb-2">Assignment Submitted</h3>
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium">Your work has been successfully uploaded and is waiting for grading.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeworkDetails;
