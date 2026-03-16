from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import hashlib
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Property Hub API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Simple token storage (in production, use Redis or JWT)
active_tokens = {}

# ============== MODELS ==============

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminResponse(BaseModel):
    id: str
    email: str
    name: str
    token: str

class Property(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    property_type: str  # hotel, homestay, adventure
    location: str
    state: str
    price_per_night: float
    description: str
    amenities: List[str] = []
    images: List[str] = []
    rating: float = 4.0
    reviews_count: int = 0
    is_featured: bool = False
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PropertyCreate(BaseModel):
    name: str
    property_type: str
    location: str
    state: str
    price_per_night: float
    description: str
    amenities: List[str] = []
    images: List[str] = []
    is_featured: bool = False

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    property_type: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    price_per_night: Optional[float] = None
    description: Optional[str] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: str
    property_name: str
    property_type: str
    guest_name: str
    guest_email: str
    guest_phone: str
    check_in: str
    check_out: str
    guests: int
    total_price: float
    status: str = "pending"  # pending, confirmed, cancelled, completed
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BookingCreate(BaseModel):
    property_id: str
    guest_name: str
    guest_email: str
    guest_phone: str
    check_in: str
    check_out: str
    guests: int

class BookingUpdate(BaseModel):
    status: str

class DashboardStats(BaseModel):
    total_properties: int
    total_bookings: int
    pending_bookings: int
    total_revenue: float
    properties_by_type: dict
    recent_bookings: List[dict]

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = credentials.credentials
    if token not in active_tokens:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return active_tokens[token]

# ============== SEED DATA ==============

async def seed_initial_data():
    # Check if admin exists
    admin = await db.admins.find_one({"email": "admin@propertyhub.com"})
    if not admin:
        await db.admins.insert_one({
            "id": str(uuid.uuid4()),
            "email": "admin@propertyhub.com",
            "password": hash_password("admin123"),
            "name": "Admin User"
        })
        logging.info("Admin user created: admin@propertyhub.com / admin123")
    
    # Check if properties exist
    count = await db.properties.count_documents({})
    if count == 0:
        properties = [
            # Hotels
            {
                "id": str(uuid.uuid4()),
                "name": "The Oberoi Udaivilas",
                "property_type": "hotel",
                "location": "Udaipur",
                "state": "Rajasthan",
                "price_per_night": 35000,
                "description": "Sprawling luxury resort on Lake Pichola with ornate domes, courtyards with fountains, and stunning lake views. Experience royal Rajasthani hospitality.",
                "amenities": ["Pool", "Spa", "Restaurant", "Lake View", "WiFi", "Room Service", "Gym"],
                "images": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"],
                "rating": 4.9,
                "reviews_count": 1250,
                "is_featured": True,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Taj Lake Palace",
                "property_type": "hotel",
                "location": "Udaipur",
                "state": "Rajasthan",
                "price_per_night": 42000,
                "description": "Floating marble palace in the middle of Lake Pichola. A symbol of romance and luxury with breathtaking sunset views.",
                "amenities": ["Pool", "Spa", "Fine Dining", "Boat Transfer", "Butler Service"],
                "images": ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800"],
                "rating": 4.8,
                "reviews_count": 980,
                "is_featured": True,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "ITC Grand Chola",
                "property_type": "hotel",
                "location": "Chennai",
                "state": "Tamil Nadu",
                "price_per_night": 18000,
                "description": "Inspired by the grandeur of the Chola dynasty, this magnificent hotel features palatial architecture and world-class amenities.",
                "amenities": ["Pool", "Spa", "Multiple Restaurants", "Business Center", "WiFi"],
                "images": ["https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"],
                "rating": 4.7,
                "reviews_count": 750,
                "is_featured": False,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            # Homestays
            {
                "id": str(uuid.uuid4()),
                "name": "Himalayan Cottage Retreat",
                "property_type": "homestay",
                "location": "Manali",
                "state": "Himachal Pradesh",
                "price_per_night": 3500,
                "description": "Cozy wooden cottage nestled in apple orchards with panoramic mountain views. Perfect for a peaceful escape.",
                "amenities": ["Mountain View", "Bonfire", "Home Cooked Meals", "Garden", "Parking"],
                "images": ["https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800"],
                "rating": 4.6,
                "reviews_count": 320,
                "is_featured": True,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Kerala Backwater Villa",
                "property_type": "homestay",
                "location": "Alleppey",
                "state": "Kerala",
                "price_per_night": 4500,
                "description": "Traditional Kerala home on the backwaters. Wake up to serene water views and enjoy authentic Kerala cuisine.",
                "amenities": ["Backwater View", "Traditional Food", "Canoe Rides", "WiFi", "AC"],
                "images": ["https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800"],
                "rating": 4.7,
                "reviews_count": 450,
                "is_featured": True,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Goan Beach House",
                "property_type": "homestay",
                "location": "Palolem",
                "state": "Goa",
                "price_per_night": 5000,
                "description": "Charming beach house steps away from the pristine Palolem beach. Portuguese-style architecture with modern comforts.",
                "amenities": ["Beach Access", "Breakfast", "WiFi", "AC", "Balcony"],
                "images": ["https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800"],
                "rating": 4.5,
                "reviews_count": 280,
                "is_featured": False,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            # Adventures
            {
                "id": str(uuid.uuid4()),
                "name": "Rishikesh River Camp",
                "property_type": "adventure",
                "location": "Rishikesh",
                "state": "Uttarakhand",
                "price_per_night": 2500,
                "description": "Adventure camp by the Ganges with rafting, bungee jumping, and camping under the stars. Thrill-seekers paradise!",
                "amenities": ["Rafting", "Bungee", "Camping", "Meals", "Bonfire", "Yoga"],
                "images": ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800"],
                "rating": 4.8,
                "reviews_count": 890,
                "is_featured": True,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Ladakh Expedition Base",
                "property_type": "adventure",
                "location": "Leh",
                "state": "Ladakh",
                "price_per_night": 4000,
                "description": "High-altitude adventure base for trekking, mountain biking, and exploring the cold desert. Includes guided expeditions.",
                "amenities": ["Trekking", "Biking", "Guide", "Equipment", "Meals", "Transport"],
                "images": ["https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800"],
                "rating": 4.7,
                "reviews_count": 560,
                "is_featured": True,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Coorg Jungle Safari Lodge",
                "property_type": "adventure",
                "location": "Coorg",
                "state": "Karnataka",
                "price_per_night": 6000,
                "description": "Eco-lodge in the coffee estates with wildlife safaris, nature walks, and coffee plantation tours.",
                "amenities": ["Safari", "Nature Walks", "Coffee Tours", "Pool", "Restaurant"],
                "images": ["https://images.unsplash.com/photo-1618767689160-da3fb810aad7?w=800"],
                "rating": 4.6,
                "reviews_count": 420,
                "is_featured": False,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.properties.insert_many(properties)
        logging.info(f"Seeded {len(properties)} properties")

# ============== AUTH ROUTES ==============

@api_router.post("/admin/login", response_model=AdminResponse)
async def admin_login(login_data: AdminLogin):
    admin = await db.admins.find_one({
        "email": login_data.email,
        "password": hash_password(login_data.password)
    }, {"_id": 0})
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = generate_token()
    active_tokens[token] = admin
    
    return AdminResponse(
        id=admin["id"],
        email=admin["email"],
        name=admin["name"],
        token=token
    )

@api_router.post("/admin/logout")
async def admin_logout(admin = Depends(get_current_admin)):
    # Remove token
    for token, user in list(active_tokens.items()):
        if user["id"] == admin["id"]:
            del active_tokens[token]
            break
    return {"message": "Logged out successfully"}

@api_router.get("/admin/me")
async def get_admin_profile(admin = Depends(get_current_admin)):
    return {"id": admin["id"], "email": admin["email"], "name": admin["name"]}

# ============== DASHBOARD ROUTES ==============

@api_router.get("/admin/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(admin = Depends(get_current_admin)):
    total_properties = await db.properties.count_documents({"is_active": True})
    total_bookings = await db.bookings.count_documents({})
    pending_bookings = await db.bookings.count_documents({"status": "pending"})
    
    # Calculate revenue from confirmed/completed bookings
    revenue_pipeline = [
        {"$match": {"status": {"$in": ["confirmed", "completed"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_price"}}}
    ]
    revenue_result = await db.bookings.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Properties by type
    type_pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$property_type", "count": {"$sum": 1}}}
    ]
    type_result = await db.bookings.aggregate(type_pipeline).to_list(10)
    properties_by_type = {item["_id"]: item["count"] for item in type_result} if type_result else {}
    
    # Get actual counts
    for ptype in ["hotel", "homestay", "adventure"]:
        count = await db.properties.count_documents({"property_type": ptype, "is_active": True})
        properties_by_type[ptype] = count
    
    # Recent bookings
    recent = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return DashboardStats(
        total_properties=total_properties,
        total_bookings=total_bookings,
        pending_bookings=pending_bookings,
        total_revenue=total_revenue,
        properties_by_type=properties_by_type,
        recent_bookings=recent
    )

# ============== PROPERTY ROUTES (PUBLIC) ==============

@api_router.get("/properties", response_model=List[Property])
async def get_properties(
    property_type: Optional[str] = None,
    state: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None
):
    query = {"is_active": True}
    
    if property_type:
        query["property_type"] = property_type
    if state:
        query["state"] = state
    if featured:
        query["is_featured"] = True
    if min_price is not None:
        query["price_per_night"] = {"$gte": min_price}
    if max_price is not None:
        if "price_per_night" in query:
            query["price_per_night"]["$lte"] = max_price
        else:
            query["price_per_night"] = {"$lte": max_price}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
            {"state": {"$regex": search, "$options": "i"}}
        ]
    
    properties = await db.properties.find(query, {"_id": 0}).to_list(100)
    return properties

@api_router.get("/properties/featured", response_model=List[Property])
async def get_featured_properties():
    properties = await db.properties.find(
        {"is_active": True, "is_featured": True}, 
        {"_id": 0}
    ).limit(6).to_list(6)
    return properties

@api_router.get("/properties/destinations")
async def get_destinations():
    pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {
            "_id": {"state": "$state", "location": "$location"},
            "count": {"$sum": 1},
            "min_price": {"$min": "$price_per_night"},
            "image": {"$first": "$images"}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 8}
    ]
    destinations = await db.properties.aggregate(pipeline).to_list(8)
    return [
        {
            "state": d["_id"]["state"],
            "location": d["_id"]["location"],
            "properties_count": d["count"],
            "starting_price": d["min_price"],
            "image": d["image"][0] if d["image"] else None
        }
        for d in destinations
    ]

@api_router.get("/properties/{property_id}", response_model=Property)
async def get_property(property_id: str):
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop

# ============== PROPERTY ROUTES (ADMIN) ==============

@api_router.get("/admin/properties", response_model=List[Property])
async def admin_get_all_properties(admin = Depends(get_current_admin)):
    properties = await db.properties.find({}, {"_id": 0}).to_list(500)
    return properties

@api_router.post("/admin/properties", response_model=Property)
async def create_property(property_data: PropertyCreate, admin = Depends(get_current_admin)):
    prop = Property(**property_data.model_dump())
    doc = prop.model_dump()
    await db.properties.insert_one(doc)
    return prop

@api_router.put("/admin/properties/{property_id}", response_model=Property)
async def update_property(property_id: str, property_data: PropertyUpdate, admin = Depends(get_current_admin)):
    update_data = {k: v for k, v in property_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.properties.update_one(
        {"id": property_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    return prop

@api_router.delete("/admin/properties/{property_id}")
async def delete_property(property_id: str, admin = Depends(get_current_admin)):
    result = await db.properties.delete_one({"id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Property deleted successfully"}

# ============== BOOKING ROUTES (PUBLIC) ==============

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate):
    # Get property details
    prop = await db.properties.find_one({"id": booking_data.property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Calculate nights and total price
    check_in = datetime.fromisoformat(booking_data.check_in)
    check_out = datetime.fromisoformat(booking_data.check_out)
    nights = (check_out - check_in).days
    if nights < 1:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")
    
    total_price = nights * prop["price_per_night"]
    
    booking = Booking(
        property_id=booking_data.property_id,
        property_name=prop["name"],
        property_type=prop["property_type"],
        guest_name=booking_data.guest_name,
        guest_email=booking_data.guest_email,
        guest_phone=booking_data.guest_phone,
        check_in=booking_data.check_in,
        check_out=booking_data.check_out,
        guests=booking_data.guests,
        total_price=total_price
    )
    
    doc = booking.model_dump()
    await db.bookings.insert_one(doc)
    return booking

# ============== BOOKING ROUTES (ADMIN) ==============

@api_router.get("/admin/bookings", response_model=List[Booking])
async def admin_get_bookings(
    status: Optional[str] = None,
    admin = Depends(get_current_admin)
):
    query = {}
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return bookings

@api_router.put("/admin/bookings/{booking_id}", response_model=Booking)
async def update_booking_status(booking_id: str, update_data: BookingUpdate, admin = Depends(get_current_admin)):
    result = await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": update_data.status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return booking

# ============== STATS ROUTES ==============

@api_router.get("/stats")
async def get_public_stats():
    hotels = await db.properties.count_documents({"property_type": "hotel", "is_active": True})
    homestays = await db.properties.count_documents({"property_type": "homestay", "is_active": True})
    adventures = await db.properties.count_documents({"property_type": "adventure", "is_active": True})
    
    return {
        "hotels": hotels,
        "homestays": homestays,
        "adventures": adventures,
        "total": hotels + homestays + adventures
    }

@api_router.get("/")
async def root():
    return {"message": "Property Hub API", "status": "running"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await seed_initial_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
