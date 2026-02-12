from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'travo-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    role: str = "owner"  # owner or admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class PropertyCreate(BaseModel):
    name: str
    property_type: str  # hotel, homestay, adventure
    description: str
    location: str
    city: str
    state: str
    address: str
    price_per_night: float
    amenities: List[str]
    images: List[str]
    rooms: int
    max_guests: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_per_night: Optional[float] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    rooms: Optional[int] = None
    max_guests: Optional[int] = None

class PropertyResponse(BaseModel):
    id: str
    name: str
    property_type: str
    description: str
    location: str
    city: str
    state: str
    address: str
    price_per_night: float
    amenities: List[str]
    images: List[str]
    rooms: int
    max_guests: int
    owner_id: str
    owner_name: str
    status: str  # pending, approved, rejected
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: str
    rating: float = 4.5
    reviews_count: int = 0

class NearbyPlace(BaseModel):
    id: str
    name: str
    type: str
    distance: str
    rating: float
    image: str
    description: str

class AdminActionRequest(BaseModel):
    property_id: str
    action: str  # approve, reject
    reason: Optional[str] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "phone": user.phone,
        "role": user.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_access_token({"sub": user_id, "role": user.role})
    user_response = UserResponse(
        id=user_id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        created_at=user_doc["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    user_response = UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        phone=user["phone"],
        role=user["role"],
        created_at=user["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        phone=current_user["phone"],
        role=current_user["role"],
        created_at=current_user["created_at"]
    )

# ==================== PROPERTY ROUTES ====================

@api_router.post("/properties", response_model=PropertyResponse)
async def create_property(property_data: PropertyCreate, current_user: dict = Depends(get_current_user)):
    property_id = str(uuid.uuid4())
    property_doc = {
        "id": property_id,
        "name": property_data.name,
        "property_type": property_data.property_type,
        "description": property_data.description,
        "location": property_data.location,
        "city": property_data.city,
        "state": property_data.state,
        "address": property_data.address,
        "price_per_night": property_data.price_per_night,
        "amenities": property_data.amenities,
        "images": property_data.images,
        "rooms": property_data.rooms,
        "max_guests": property_data.max_guests,
        "owner_id": current_user["id"],
        "owner_name": current_user["name"],
        "status": "pending",
        "latitude": property_data.latitude or 28.6139,
        "longitude": property_data.longitude or 77.2090,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "rating": 4.5,
        "reviews_count": 0
    }
    await db.properties.insert_one(property_doc)
    return PropertyResponse(**property_doc)

@api_router.get("/properties", response_model=List[PropertyResponse])
async def get_properties(
    status: Optional[str] = None,
    property_type: Optional[str] = None,
    city: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 50
):
    query = {"status": "approved"}
    if status:
        query["status"] = status
    if property_type:
        query["property_type"] = property_type
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if min_price:
        query["price_per_night"] = {"$gte": min_price}
    if max_price:
        query.setdefault("price_per_night", {})["$lte"] = max_price
    
    properties = await db.properties.find(query, {"_id": 0}).to_list(limit)
    return [PropertyResponse(**p) for p in properties]

@api_router.get("/properties/featured", response_model=List[PropertyResponse])
async def get_featured_properties():
    properties = await db.properties.find(
        {"status": "approved"},
        {"_id": 0}
    ).sort("rating", -1).to_list(6)
    return [PropertyResponse(**p) for p in properties]

@api_router.get("/properties/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: str):
    property_doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    return PropertyResponse(**property_doc)

@api_router.put("/properties/{property_id}", response_model=PropertyResponse)
async def update_property(property_id: str, updates: PropertyUpdate, current_user: dict = Depends(get_current_user)):
    property_doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    if property_doc["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if update_data:
        await db.properties.update_one({"id": property_id}, {"$set": update_data})
    
    updated = await db.properties.find_one({"id": property_id}, {"_id": 0})
    return PropertyResponse(**updated)

@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str, current_user: dict = Depends(get_current_user)):
    property_doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    if property_doc["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.properties.delete_one({"id": property_id})
    return {"message": "Property deleted successfully"}

# ==================== OWNER ROUTES ====================

@api_router.get("/owner/properties", response_model=List[PropertyResponse])
async def get_owner_properties(current_user: dict = Depends(get_current_user)):
    properties = await db.properties.find(
        {"owner_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    return [PropertyResponse(**p) for p in properties]

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/properties", response_model=List[PropertyResponse])
async def get_all_properties_admin(
    status: Optional[str] = None,
    admin_user: dict = Depends(get_admin_user)
):
    query = {}
    if status:
        query["status"] = status
    properties = await db.properties.find(query, {"_id": 0}).to_list(100)
    return [PropertyResponse(**p) for p in properties]

@api_router.post("/admin/properties/action")
async def admin_property_action(action_req: AdminActionRequest, admin_user: dict = Depends(get_admin_user)):
    property_doc = await db.properties.find_one({"id": action_req.property_id}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    new_status = "approved" if action_req.action == "approve" else "rejected"
    await db.properties.update_one(
        {"id": action_req.property_id},
        {"$set": {"status": new_status}}
    )
    return {"message": f"Property {new_status} successfully"}

@api_router.get("/admin/stats")
async def get_admin_stats(admin_user: dict = Depends(get_admin_user)):
    total = await db.properties.count_documents({})
    pending = await db.properties.count_documents({"status": "pending"})
    approved = await db.properties.count_documents({"status": "approved"})
    rejected = await db.properties.count_documents({"status": "rejected"})
    users = await db.users.count_documents({"role": "owner"})
    
    return {
        "total_properties": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "total_owners": users
    }

# ==================== NEARBY PLACES (MOCK) ====================

MOCK_NEARBY_PLACES = [
    {"id": "1", "name": "Taj Mahal", "type": "Monument", "distance": "2.5 km", "rating": 4.9, "image": "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400", "description": "Iconic white marble mausoleum"},
    {"id": "2", "name": "India Gate", "type": "Monument", "distance": "3.8 km", "rating": 4.7, "image": "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400", "description": "War memorial and national landmark"},
    {"id": "3", "name": "Red Fort", "type": "Historical", "distance": "5.2 km", "rating": 4.6, "image": "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=400", "description": "Historic Mughal fort complex"},
    {"id": "4", "name": "Lotus Temple", "type": "Temple", "distance": "4.1 km", "rating": 4.8, "image": "https://images.unsplash.com/photo-1588091373218-a36901a95596?w=400", "description": "Architectural marvel worship house"},
    {"id": "5", "name": "Qutub Minar", "type": "Monument", "distance": "6.5 km", "rating": 4.5, "image": "https://images.unsplash.com/photo-1548013146-72479768bada?w=400", "description": "Tallest brick minaret in world"},
    {"id": "6", "name": "Humayun's Tomb", "type": "Historical", "distance": "3.2 km", "rating": 4.7, "image": "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=400", "description": "Mughal architecture masterpiece"},
]

@api_router.get("/properties/{property_id}/nearby", response_model=List[NearbyPlace])
async def get_nearby_places(property_id: str):
    # In production, this would use Google Places API
    # For now, returning mock data
    return MOCK_NEARBY_PLACES

# ==================== SEARCH ====================

@api_router.get("/search")
async def search_properties(
    q: Optional[str] = None,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    guests: Optional[int] = None
):
    query = {"status": "approved"}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
            {"state": {"$regex": q, "$options": "i"}},
            {"location": {"$regex": q, "$options": "i"}}
        ]
    if guests:
        query["max_guests"] = {"$gte": guests}
    
    properties = await db.properties.find(query, {"_id": 0}).to_list(20)
    return [PropertyResponse(**p) for p in properties]

# ==================== DESTINATIONS ====================

@api_router.get("/destinations")
async def get_destinations():
    return [
        {"id": "1", "name": "Goa", "image": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600", "properties_count": 245},
        {"id": "2", "name": "Manali", "image": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600", "properties_count": 189},
        {"id": "3", "name": "Jaipur", "image": "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600", "properties_count": 312},
        {"id": "4", "name": "Kerala", "image": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600", "properties_count": 278},
        {"id": "5", "name": "Udaipur", "image": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600", "properties_count": 156},
        {"id": "6", "name": "Rishikesh", "image": "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=600", "properties_count": 134},
    ]

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    # Check if admin exists
    admin = await db.users.find_one({"email": "admin@travo.com"})
    if not admin:
        admin_id = str(uuid.uuid4())
        await db.users.insert_one({
            "id": admin_id,
            "name": "Admin",
            "email": "admin@travo.com",
            "password": hash_password("admin123"),
            "phone": "9999999999",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Check if sample properties exist
    existing = await db.properties.count_documents({})
    if existing == 0:
        sample_properties = [
            {
                "id": str(uuid.uuid4()),
                "name": "Luxury Beach Villa",
                "property_type": "hotel",
                "description": "Experience paradise at our stunning beachfront villa with private pool, modern amenities, and breathtaking ocean views. Perfect for couples and families seeking a luxurious getaway.",
                "location": "Calangute Beach",
                "city": "Goa",
                "state": "Goa",
                "address": "123 Beach Road, Calangute",
                "price_per_night": 8500,
                "amenities": ["WiFi", "Pool", "AC", "Beach Access", "Restaurant", "Spa"],
                "images": ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"],
                "rooms": 5,
                "max_guests": 10,
                "owner_id": "sample",
                "owner_name": "Sample Owner",
                "status": "approved",
                "latitude": 15.5449,
                "longitude": 73.7550,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "rating": 4.8,
                "reviews_count": 124
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Mountain View Homestay",
                "property_type": "homestay",
                "description": "Cozy mountain retreat with stunning Himalayan views. Wake up to fresh mountain air and enjoy authentic local cuisine prepared by our host family.",
                "location": "Old Manali",
                "city": "Manali",
                "state": "Himachal Pradesh",
                "address": "45 Hill View Road, Old Manali",
                "price_per_night": 3500,
                "amenities": ["WiFi", "Mountain View", "Breakfast", "Parking", "Bonfire"],
                "images": ["https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800", "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800"],
                "rooms": 3,
                "max_guests": 6,
                "owner_id": "sample",
                "owner_name": "Sample Owner",
                "status": "approved",
                "latitude": 32.2432,
                "longitude": 77.1892,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "rating": 4.9,
                "reviews_count": 89
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Royal Heritage Haveli",
                "property_type": "hotel",
                "description": "Step back in time at this beautifully restored 200-year-old haveli. Experience royal Rajasthani hospitality with modern comforts.",
                "location": "Pink City",
                "city": "Jaipur",
                "state": "Rajasthan",
                "address": "78 Heritage Lane, Jaipur",
                "price_per_night": 6500,
                "amenities": ["WiFi", "Heritage", "Restaurant", "Cultural Shows", "AC", "Rooftop"],
                "images": ["https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800", "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"],
                "rooms": 8,
                "max_guests": 16,
                "owner_id": "sample",
                "owner_name": "Sample Owner",
                "status": "approved",
                "latitude": 26.9124,
                "longitude": 75.7873,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "rating": 4.7,
                "reviews_count": 156
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Backwater Houseboat",
                "property_type": "adventure",
                "description": "Cruise through Kerala's serene backwaters on our traditional houseboat. Includes chef, crew, and unforgettable sunset views.",
                "location": "Alleppey Backwaters",
                "city": "Alleppey",
                "state": "Kerala",
                "address": "Boat Jetty, Alleppey",
                "price_per_night": 12000,
                "amenities": ["All Meals", "AC", "Sundeck", "Fishing", "Chef", "Crew"],
                "images": ["https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800", "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?w=800"],
                "rooms": 2,
                "max_guests": 4,
                "owner_id": "sample",
                "owner_name": "Sample Owner",
                "status": "approved",
                "latitude": 9.4981,
                "longitude": 76.3388,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "rating": 4.9,
                "reviews_count": 201
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Lake Palace Resort",
                "property_type": "hotel",
                "description": "Romantic lakeside resort with stunning views of Lake Pichola. Perfect for honeymoons and special celebrations.",
                "location": "Lake Pichola",
                "city": "Udaipur",
                "state": "Rajasthan",
                "address": "Lake Palace Road, Udaipur",
                "price_per_night": 15000,
                "amenities": ["WiFi", "Lake View", "Spa", "Restaurant", "Pool", "Boat Ride"],
                "images": ["https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800", "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800"],
                "rooms": 12,
                "max_guests": 24,
                "owner_id": "sample",
                "owner_name": "Sample Owner",
                "status": "approved",
                "latitude": 24.5854,
                "longitude": 73.6800,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "rating": 4.8,
                "reviews_count": 178
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Riverside Yoga Retreat",
                "property_type": "adventure",
                "description": "Find peace at our yoga retreat on the banks of the Ganges. Daily yoga sessions, meditation, and organic vegetarian meals included.",
                "location": "Laxman Jhula",
                "city": "Rishikesh",
                "state": "Uttarakhand",
                "address": "Near Laxman Jhula Bridge",
                "price_per_night": 4500,
                "amenities": ["Yoga", "Meditation", "Organic Food", "River View", "WiFi"],
                "images": ["https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=800", "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800"],
                "rooms": 6,
                "max_guests": 12,
                "owner_id": "sample",
                "owner_name": "Sample Owner",
                "status": "approved",
                "latitude": 30.1258,
                "longitude": 78.3214,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "rating": 4.6,
                "reviews_count": 92
            }
        ]
        await db.properties.insert_many(sample_properties)
    
    return {"message": "Seed data created successfully"}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Travo API - Travel Booking Platform"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
