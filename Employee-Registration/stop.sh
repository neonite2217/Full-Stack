#!/bin/bash

# User Data Management System - Stop Script

echo "🛑 Stopping User Data Management System..."

# Kill backend processes
echo "🐍 Stopping backend server..."
pkill -f "python backend.py" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend stopped"
else
    echo "ℹ️  No backend process found"
fi

# Kill frontend processes
echo "⚛️  Stopping frontend server..."
pkill -f "npm start" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Frontend stopped"
else
    echo "ℹ️  No frontend process found"
fi

# Kill any remaining Node processes related to the project
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null

echo ""
echo "✅ System stopped successfully!"
echo ""
echo "💡 Note: PostgreSQL and Redis services are still running"
echo "   Stop them manually if needed:"
echo "   - PostgreSQL: sudo systemctl stop postgresql"
echo "   - Redis: redis-cli shutdown"