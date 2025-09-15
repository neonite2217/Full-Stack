![Star Badge](https://img.shields.io/static/v1?label=%F0%9F%8C%9F&message=If%20Useful&style=style=flat&color=BC4E99)
![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)
[![View My Profile](https://img.shields.io/badge/View-My_Profile-green?logo=GitHub)](https://github.com/neonite2217)
[![View Repositories](https://img.shields.io/badge/View-My_Repositories-blue?logo=GitHub)](https://github.com/neonite2217?tab=repositories)

# Employee-Registration

A full-stack web application for collecting and managing user data through a multi-step form interface. The system uses Redis for temporary session storage and PostgreSQL for permanent data storage.

# Project Summary

## 🎯 What This Project Does

A complete user data management system with:
- **Multi-step form** for collecting user information
- **Redis** for temporary session storage
- **PostgreSQL** for permanent data storage
- **React frontend** with modern UI
- **FastAPI backend** with async support

## 🏗️ Architecture

```
user-data-management/
├── backend/
│   ├── .env.example       # Environment template
│   ├── backend.py         # Complete FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .venv/            # Virtual environment
├── frontend/
│   ├── src/App.js        # Main React component
│   ├── package.json      # Node.js dependencies
│   └── tailwind.config.js # Styling configuration
├── README.md             # Complete documentation
├── requirements.txt      # Project overview
├── start.sh             # One-command startup
└── stop.sh              # One-command shutdown
```

## ✅ Features Included

### Frontend
- ✅ 3-step responsive form
- ✅ Real-time validation
- ✅ Progress indicator
- ✅ Session management
- ✅ Error handling
- ✅ Tailwind CSS styling

### Backend
- ✅ FastAPI with async support
- ✅ Redis session storage
- ✅ PostgreSQL permanent storage
- ✅ Data validation
- ✅ CRUD operations
- ✅ OpenAPI documentation
- ✅ CORS configuration

### Data Flow
- ✅ Session creation
- ✅ Step-by-step data collection
- ✅ Temporary Redis storage
- ✅ Final PostgreSQL submission
- ✅ Automatic cleanup

```
Frontend (React) → Backend (FastAPI) → Redis (Temp) → PostgreSQL (Permanent)
```

- **Frontend**: React.js with Tailwind CSS for responsive UI
- **Backend**: FastAPI with async support
- **Temporary Storage**: Redis for session-based data
- **Permanent Storage**: PostgreSQL for final user records
- **Session Management**: UUID-based sessions with automatic cleanup

## 📋 Features

### Multi-Step Form
- **Step 1**: Personal Information (Name, Phone, Email, DOB)
- **Step 2**: Education Background (10th, 12th, Graduation marks)
- **Step 3**: Experience Details (Company, Domain, Years, Salary)

### Data Flow
1. **Session Creation**: Unique session ID generated for each user
2. **Temporary Storage**: Each step saves data to Redis with session key
3. **Validation**: Real-time form validation on frontend and backend
4. **Final Submission**: All data moved from Redis to PostgreSQL
5. **Cleanup**: Redis session data automatically deleted after submission

### API Features
- RESTful API with OpenAPI documentation
- CRUD operations for user management
- Session-based data isolation
- Comprehensive error handling
- CORS support for frontend integration

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL 12+
- Redis 6+

### Requirements

## System Requirements
- Python 3.8+
- Node.js 14+
- PostgreSQL 12+
- Redis 6+

## Python Dependencies (Backend)
 See backend/requirements.txt for detailed Python packages
# Main packages:
 - fastapi==0.104.1
 - uvicorn[standard]==0.24.0
 - psycopg2-binary==2.9.9
 - redis==5.0.1
 - sqlalchemy==2.0.23
 - pydantic==2.5.0

## Node.js Dependencies (Frontend)
 See frontend/package.json for detailed Node packages
# Main packages:
 - react==18.2.0
 - lucide-react==0.263.1
 - tailwindcss==3.3.0
## Database Requirements
 PostgreSQL database named 'userdata'
# Redis server running on default port 6379

## Installation Commands

### Backend Setup:
 cd backend
 python -m venv .venv
 source .venv/bin/activate
 On Windows: .venv\Scripts\activate
 pip install -r requirements.txt

### Frontend Setup:
 cd frontend
 npm install

### Database Setup:
# PostgreSQL: CREATE DATABASE userdata;
# Redis: redis-server

## Environment Configuration
 Copy backend/.env.example to backend/.env
 Update database credentials in .env file

## Running the Application
 Terminal 1 (Backend): cd backend && source .venv/bin/activate && python backend.py
 Terminal 2 (Frontend): cd frontend && npm start
 Terminal 3 (Redis): redis-server
 PostgreSQL should be running as a service

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/neonite2217/Full-Stack.git 
cd Full-Stack/Employee-Registration
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Database Setup
```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE userdata;
\q

# Start Redis server
redis-server
```

### 4. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 5. Start Backend
```bash
cd ../backend
source .venv/bin/activate
python backend.py
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health


## 🔧 Configuration

### Backend Environment (.env)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/userdata
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-super-secret-key-change-in-production
DEBUG=True
CORS_ORIGINS_STR=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend Configuration
The frontend automatically connects to the backend at `http://localhost:8000`. Update the `API_BASE_URL` in `src/App.js` if needed.

## 📊 API Endpoints

### Session Management
- `POST /api/create-session` - Create new session

### Data Collection (Redis)
- `POST /api/personal` - Save personal information
- `POST /api/education` - Save education information  
- `POST /api/experience` - Save experience information
- `GET /api/personal` - Retrieve personal information
- `GET /api/education` - Retrieve education information

### Final Submission (PostgreSQL)
- `POST /api/submit-final` - Submit all data to database

### User Management
- `GET /api/users` - List all users
- `GET /api/users/{id}` - Get specific user
- `DELETE /api/users/{id}` - Delete user

## 🧪 Testing

### Manual Testing
1. Open http://localhost:3000
2. Fill out the 3-step form
3. Verify data submission
4. Check http://localhost:8000/docs for API testing

### API Testing
```bash
# Create session
curl -X POST http://localhost:8000/api/create-session

# Save personal info
curl -X POST http://localhost:8000/api/personal \
  -H "Content-Type: application/json" \
  -H "x-session-id: YOUR_SESSION_ID" \
  -d '{"name":"John Doe","phone_number":"1234567890","email":"john@example.com","date_of_birth":"1990-01-01"}'

# View all users
curl http://localhost:8000/api/users
```

## 🔍 Monitoring

### Redis Monitoring
```bash
# Check active sessions
redis-cli keys "user_data:*"

# Monitor Redis operations
redis-cli monitor
```

### PostgreSQL Monitoring
```sql
-- Check user count
SELECT COUNT(*) FROM users;

-- View recent users
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
```

## 🛠️ Development

## 🎥 Demo Videos

### Frontend Demo
[![Frontend Demo](https://img.shields.io/badge/▶-Watch%20Frontend%20Demo-blue)](./Frontend.webm)

### Database Info Demo
[![Database Demo](https://img.shields.io/badge/▶-Watch%20Database%20Demo-green)](./databaseinfo.webm)


### Adding New Fields
1. Update Pydantic models in `backend.py`
2. Add database columns to User model
3. Update frontend form components
4. Run database migrations if needed

### Customizing Validation
- Backend validation: Modify Pydantic field validators
- Frontend validation: Update validation functions in `App.js`

## 🚨 Troubleshooting

### Common Issues

**Backend won't start**
- Check if PostgreSQL and Redis are running
- Verify database credentials in `.env`
- Ensure virtual environment is activated

**Frontend can't connect to backend**
- Verify backend is running on port 8000
- Check CORS configuration in backend
- Confirm API_BASE_URL in frontend

**Data not saving**
- Check Redis connection: `redis-cli ping`
- Verify PostgreSQL connection
- Check browser console for errors

**Port conflicts**
- Backend: Change port in `backend.py`
- Frontend: Set PORT environment variable

### Logs
- Backend logs: Console output when running `python backend.py`
- Frontend logs: Browser developer console
- Redis logs: Redis server console output

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## For issues and questions:
- Check the troubleshooting section
- Review API documentation at http://localhost:8000/docs
- Open an issue in the repository


## 🚀 Quick Start Commands

```bash
# 1. Setup (first time only)
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# 2. Start everything(one-step solution)
./start.sh

# 3. Stop everything
./stop.sh
```
