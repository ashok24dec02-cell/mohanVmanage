# 🎓 Vmanage-v1

> A comprehensive, modern School Management System designed for high performance, intuitive navigation, and beautiful aesthetics. Built with a robust Django backend and a blazing-fast React + Vite frontend.

---

## 🚀 Key Modules & Features

### 💻 Frontend (React + Vite + TailwindCSS)
- **Responsive Navigation**: Interactive sidebar designed with glassmorphism and smooth micro-animations.
- **Admin Dashboard**: Manage admissions, fees, staff accounts, and system-wide settings.
- **Student Portal**: Beautiful interface for checking timetables, exam marks, performance tracking, and automated drug detection logs.
- **Modern Styling**: Dark/light gradients, harmonious premium color schemes, and seamless UI transitions.

### 🐍 Backend (Django + MongoDB)
- **FastAPI-like Django Views**: Database queries utilizing dynamic MongoDB integration.
- **Timetable Engine**: Custom slot generation, daily timetable merger, clash detector, substitute allocator, and teacher workload balancer.
- **Authentication**: Secure JWT-based authentication system.
- **Dynamic Collections**: Collections configured for Students, Parents, Attendance, Fees, and Timetables.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, TailwindCSS, CSS Modules |
| **Backend** | Python, Django, MongoDB (pymongo) |
| **State & Styling** | HSL Tailored Gradients, Custom Animations |

---

## 📥 Project Setup & Installation

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB instance running

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   python manage.py runserver
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the required packages:
   ```bash
   npm install
   ```
3. Launch the hot-reloading development server:
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```text
Vmanage-v1/
├── backend/          # Django Backend API & Timetable Engine
│   ├── Vmanage/      # Main Django App config & URLs
│   ├── student/      # Student API endpoints and Views
│   ├── vadmin/       # Administrative APIs & Timetable Generator
│   ├── db/           # MongoDB Connection and schema setup
│   └── ...
├── frontend/         # React + Vite Frontend
│   ├── src/
│   │   ├── admin/    # Admin panel components and layout
│   │   ├── Student/  # Student portal components
│   │   └── assets/   # Premium UI graphics and icons
│   └── ...
├── .gitignore        # Global exclusion patterns (Django, Node, IDEs)
└── README.md         # Main Project Documentation (this file)
```

---

## 🔒 License
This project is proprietary and confidential. All rights reserved.
