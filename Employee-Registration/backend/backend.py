import os
import json
import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, field_validator
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine, Column, Integer, String, Date, Numeric, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as redis
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# =============================================================================
# CONFIGURATION
# =============================================================================
class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:2217@localhost:5432/userdata")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    CORS_ORIGINS_STR: str = os.getenv("CORS_ORIGINS_STR", "http://localhost:3000,http://127.0.0.1:3000")
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS_STR.split(",") if origin.strip()]

settings = Settings()

# =============================================================================
# DATABASE SETUP
# =============================================================================
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, echo=settings.DEBUG)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =============================================================================
# DATABASE MODELS
# =============================================================================
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    # Personal Information
    name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False)
    # Education Information
    tenth_percentage = Column(Numeric(5, 2))
    twelfth_percentage = Column(Numeric(5, 2))
    graduation_marks = Column(Numeric(5, 2))
    # Experience Information
    company_name = Column(String(255))
    domain = Column(String(255))
    years_of_experience = Column(Numeric(4, 1))
    last_salary = Column(Numeric(12, 2))
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    department = Column(String(255), nullable=False)
    position = Column(String(255), nullable=False)
    salary = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Create tables
Base.metadata.create_all(bind=engine)

# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================
class PersonalInfoBase(BaseModel):
    name: str
    phone_number: str
    email: EmailStr
    date_of_birth: date

    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v):
        if len(v) != 10 or not v.isdigit():
            raise ValueError('Phone number must be exactly 10 digits')
        return v

class EducationInfoBase(BaseModel):
    tenth_percentage: Decimal
    twelfth_percentage: Decimal
    graduation_marks: Decimal

    @field_validator('tenth_percentage', 'twelfth_percentage', 'graduation_marks')
    @classmethod
    def validate_percentage(cls, v):
        if v < 0 or v > 100:
            raise ValueError('Percentage must be between 0 and 100')
        return v

class ExperienceInfoBase(BaseModel):
    company_name: str
    domain: str
    years_of_experience: Decimal
    last_salary: Decimal

    @field_validator('years_of_experience')
    @classmethod
    def validate_experience(cls, v):
        if v < 0:
            raise ValueError('Years of experience must be positive')
        return v

    @field_validator('last_salary')
    @classmethod
    def validate_salary(cls, v):
        if v < 0:
            raise ValueError('Salary must be positive')
        return v

class UserResponse(BaseModel):
    id: int
    name: str
    phone_number: str
    email: EmailStr
    date_of_birth: date
    tenth_percentage: Optional[Decimal] = None
    twelfth_percentage: Optional[Decimal] = None
    graduation_marks: Optional[Decimal] = None
    company_name: Optional[str] = None
    domain: Optional[str] = None
    years_of_experience: Optional[Decimal] = None
    last_salary: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    department: str
    position: str
    salary: Decimal

class EmployeeResponse(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# =============================================================================
# REDIS CLIENT
# =============================================================================
class RedisClient:
    def __init__(self):
        self.redis = None
    
    async def connect(self):
        if not self.redis:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        return self.redis
    
    async def set_user_data(self, session_id: str, data_type: str, data: Dict[Any, Any], expire_minutes: int = 60):
        if not self.redis:
            await self.connect()
        
        key = f"user_data:{session_id}:{data_type}"
        serialized_data = json.dumps(data, default=str)
        await self.redis.setex(key, expire_minutes * 60, serialized_data)
        return True
    
    async def get_user_data(self, session_id: str, data_type: str) -> Optional[Dict[Any, Any]]:
        if not self.redis:
            await self.connect()
        
        key = f"user_data:{session_id}:{data_type}"
        data = await self.redis.get(key)
        
        if data:
            return json.loads(data)
        return None
    
    async def get_all_user_data(self, session_id: str) -> Dict[str, Any]:
        if not self.redis:
            await self.connect()
        
        personal = await self.get_user_data(session_id, "personal") or {}
        education = await self.get_user_data(session_id, "education") or {}
        experience = await self.get_user_data(session_id, "experience") or {}
        
        return {
            "personal": personal,
            "education": education,
            "experience": experience
        }
    
    async def delete_user_data(self, session_id: str):
        if not self.redis:
            await self.connect()
        
        keys = [
            f"user_data:{session_id}:personal",
            f"user_data:{session_id}:education",
            f"user_data:{session_id}:experience"
        ]
        
        await self.redis.delete(*keys)
        return True

redis_client = RedisClient()

# =============================================================================
# CRUD OPERATIONS
# =============================================================================
def create_user(db: Session, personal: PersonalInfoBase, education: EducationInfoBase, experience: ExperienceInfoBase) -> User:
    db_user = User(
        name=personal.name,
        phone_number=personal.phone_number,
        email=personal.email,
        date_of_birth=personal.date_of_birth,
        tenth_percentage=education.tenth_percentage,
        twelfth_percentage=education.twelfth_percentage,
        graduation_marks=education.graduation_marks,
        company_name=experience.company_name,
        domain=experience.domain,
        years_of_experience=experience.years_of_experience,
        last_salary=experience.last_salary
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()

def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def delete_user(db: Session, user_id: int) -> bool:
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False

# =============================================================================
# FASTAPI APPLICATION
# =============================================================================
app = FastAPI(
    title="User Data Management API",
    description="Multi-page user data collection with Redis and PostgreSQL",
    version="1.0.0",
    debug=settings.DEBUG
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Utility function for session management
def get_or_create_session_id(session_id: Optional[str] = Header(None, alias="x-session-id")) -> str:
    if not session_id:
        session_id = str(uuid.uuid4())
    return session_id

# =============================================================================
# API ENDPOINTS
# =============================================================================

# Root endpoint
@app.get("/")
async def root():
    return {"message": "User Data Management API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Session management
@app.post("/api/create-session")
async def create_session():
    session_id = str(uuid.uuid4())
    return {"session_id": session_id, "message": "Session created successfully"}

# Redis endpoints for temporary storage
@app.post("/api/personal")
async def save_personal_info(
    personal_info: PersonalInfoBase,
    session_id: str = Depends(get_or_create_session_id)
):
    try:
        data = personal_info.dict()
        if 'date_of_birth' in data:
            data['date_of_birth'] = str(data['date_of_birth'])
        
        await redis_client.set_user_data(session_id, "personal", data)
        return {
            "success": True,
            "message": "Personal information saved to Redis",
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save personal information: {str(e)}")

@app.post("/api/education")
async def save_education_info(
    education_info: EducationInfoBase,
    session_id: str = Depends(get_or_create_session_id)
):
    try:
        data = education_info.dict()
        for key, value in data.items():
            if hasattr(value, '__float__'):
                data[key] = float(value)
        
        await redis_client.set_user_data(session_id, "education", data)
        return {
            "success": True,
            "message": "Education information saved to Redis",
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save education information: {str(e)}")

@app.post("/api/experience")
async def save_experience_info(
    experience_info: ExperienceInfoBase,
    session_id: str = Depends(get_or_create_session_id)
):
    try:
        data = experience_info.dict()
        for key, value in data.items():
            if hasattr(value, '__float__'):
                data[key] = float(value)
        
        await redis_client.set_user_data(session_id, "experience", data)
        return {
            "success": True,
            "message": "Experience information saved to Redis",
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save experience information: {str(e)}")

@app.get("/api/personal")
async def get_personal_info(session_id: str = Depends(get_or_create_session_id)):
    try:
        data = await redis_client.get_user_data(session_id, "personal")
        return {
            "success": True,
            "data": data,
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve personal information: {str(e)}")

@app.get("/api/education")
async def get_education_info(session_id: str = Depends(get_or_create_session_id)):
    try:
        data = await redis_client.get_user_data(session_id, "education")
        return {
            "success": True,
            "data": data,
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve education information: {str(e)}")

# Final submission endpoint
@app.post("/api/submit-final", response_model=UserResponse)
async def submit_final_data(
    session_id: str = Depends(get_or_create_session_id),
    db: Session = Depends(get_db)
):
    try:
        # Retrieve all data from Redis
        all_data = await redis_client.get_all_user_data(session_id)
        
        personal_data = all_data.get("personal")
        education_data = all_data.get("education")
        experience_data = all_data.get("experience")
        
        if not personal_data or not education_data or not experience_data:
            raise HTTPException(
                status_code=400, 
                detail="Incomplete data. Please complete all three steps."
            )
        
        # Convert string date back to date object
        if 'date_of_birth' in personal_data:
            personal_data['date_of_birth'] = datetime.strptime(
                personal_data['date_of_birth'], '%Y-%m-%d'
            ).date()
        
        # Create schema objects
        personal_info = PersonalInfoBase(**personal_data)
        education_info = EducationInfoBase(**education_data)
        experience_info = ExperienceInfoBase(**experience_data)
        
        # Check if user with this email already exists
        existing_user = get_user_by_email(db, personal_info.email)
        if existing_user:
            raise HTTPException(
                status_code=400, 
                detail="User with this email already exists"
            )
        
        # Create user in PostgreSQL
        new_user = create_user(db, personal_info, education_info, experience_info)
        
        # Clean up Redis data after successful submission
        await redis_client.delete_user_data(session_id)
        
        return new_user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit final data: {str(e)}")

# User management endpoints
@app.get("/api/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    return get_users(db, skip=skip, limit=limit)

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.delete("/api/users/{user_id}")
async def delete_user_by_id(user_id: int, db: Session = Depends(get_db)):
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# Employee endpoints
@app.post("/api/employees", response_model=EmployeeResponse)
async def create_employee(employee: EmployeeBase, db: Session = Depends(get_db)):
    db_employee = Employee(**employee.dict())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

@app.get("/api/employees", response_model=List[EmployeeResponse])
async def get_all_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    return db.query(Employee).offset(skip).limit(limit).all()

# =============================================================================
# RUN APPLICATION
# =============================================================================
if __name__ == "__main__":
    uvicorn.run(
        "backend:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
