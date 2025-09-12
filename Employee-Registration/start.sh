#!/bin/bash

# User Data Management System - Startup Script

echo "🚀 Starting User Data Management System..."

# Check if required services are running
echo "📋 Checking prerequisites..."

# Check PostgreSQL
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL service."
    exit 1
fi
echo "✅ PostgreSQL is running"

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start Redis server."
    echo "   Run: redis-server"
    exit 1
fi
echo "✅ Redis is running"

# Check if backend dependencies are installed
if [ ! -d "backend/.venv" ]; then
    echo "📦 Setting up backend virtual environment..."
    cd backend
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Creating from example..."
    cp backend/.env.example backend/.env
    echo "📝 Please edit backend/.env with your database credentials"
    echo "   Default PostgreSQL URL: postgresql://postgres:password@localhost:5432/userdata"
fi

echo ""
echo "🎯 Starting services..."
echo ""

# Start backend in background
echo "🐍 Starting backend server..."
cd backend
source .venv/bin/activate
nohup python backend.py > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend started successfully
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend started successfully on http://localhost:8000"
else
    echo "❌ Backend failed to start. Check backend/backend.log for errors."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo "⚛️  Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 5

echo ""
echo "🎉 System started successfully!"
echo ""
echo "📍 Access Points:"
echo "   Frontend:     http://localhost:3000"
echo "   Backend API:  http://localhost:8000"
echo "   API Docs:     http://localhost:8000/docs"
echo ""
echo "📝 Logs:"
echo "   Backend:      backend/backend.log"
echo "   Frontend:     Terminal output"
echo ""
echo "🛑 To stop the system:"
echo "   Press Ctrl+C to stop frontend"
echo "   Kill backend: kill $BACKEND_PID"
echo ""

# Keep script running to monitor frontend
wait $FRONTEND_PID