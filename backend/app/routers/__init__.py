"""AIExchange API Routers"""
from app.routers.auth import router as auth_router
from app.routers.vendor import router as vendor_router
from app.routers.buyer import router as buyer_router
from app.routers.admin import router as admin_router
from app.routers.gateway import router as gateway_router
from app.routers.marketplace import router as marketplace_router

__all__ = [
    "auth_router",
    "vendor_router",
    "buyer_router",
    "admin_router",
    "gateway_router",
    "marketplace_router"
]
