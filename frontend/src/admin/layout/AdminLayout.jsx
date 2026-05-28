import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../home/AdminHome.css'; // Use existing global admin styles

const AdminLayout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const adminId = localStorage.getItem('admin_id');
        const name = localStorage.getItem('admin_name');

        if (!adminId || !name) {
            navigate('/admin/login');
        }
    }, [navigate]);

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
