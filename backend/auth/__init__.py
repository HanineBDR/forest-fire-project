"""
IN9AD Authentication System
Role-Based Access Control (RBAC) for Algerian Civil Protection, Forest Guards, and Administrators.
"""

from .service import (
    authenticate_user,
    create_access_token,
    verify_token,
    get_current_user,
    get_admin_user,
    create_user,
    list_users,
    delete_user,
    ROLE_ADMIN,
    ROLE_CIVIL_PROTECTION,
    ROLE_FOREST_GUARD,
    DEMO_USERS,
)
from .routes import router as auth_router

__all__ = [
    "authenticate_user",
    "create_access_token",
    "verify_token",
    "get_current_user",
    "get_admin_user",
    "create_user",
    "list_users",
    "delete_user",
    "ROLE_ADMIN",
    "ROLE_CIVIL_PROTECTION",
    "ROLE_FOREST_GUARD",
    "DEMO_USERS",
    "auth_router",
]
