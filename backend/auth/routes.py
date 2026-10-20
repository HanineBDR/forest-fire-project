"""
IN9AD - Authentication Endpoints
Provides login, user management, and session retrieval.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field

from .service import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_admin_user,
    create_user,
    list_users,
    delete_user,
    ROLE_ADMIN,
    ROLE_CIVIL_PROTECTION,
    ROLE_FOREST_GUARD,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: str = Field(..., example="protection@in9ad.dz")
    password: str = Field(..., example="Protect123!")


class CreateUserRequest(BaseModel):
    email: str = Field(..., example="officer.tizi@in9ad.dz")
    password: str = Field(..., min_length=6, example="Officer2026!")
    name: str = Field(..., example="Lieutenant Karim Belkacem")
    role: str = Field(..., example="CIVIL_PROTECTION")
    organization: Optional[str] = Field(None, example="Protection Civile - Unité Principale Tizi Ouzou")


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    organization: Optional[str] = None
    organization_ar: Optional[str] = None
    created_at: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: UserResponse


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, response: Response):
    """
    Authenticates user and returns JWT token.
    Sets httpOnly session cookie for seamless Next.js frontend state.
    """
    user = authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants invalides. Vérifiez l'adresse e-mail et le mot de passe."
        )

    token = create_access_token(user)

    # Set httpOnly cookie
    response.set_cookie(
        key="in9ad_auth_token",
        value=token,
        httponly=True,
        max_age=86400,
        samesite="lax",
        secure=False  # Set True in HTTPS production
    )

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        role=user["role"],
        user=UserResponse(**user)
    )


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Returns currently authenticated user profile."""
    return UserResponse(**current_user)


@router.post("/create-user", response_model=UserResponse)
def add_user(req: CreateUserRequest, admin_user: dict = Depends(get_admin_user)):
    """
    Creates a new authorized account.
    Restricted to ADMIN role only.
    """
    try:
        new_u = create_user(
            email=req.email,
            password=req.password,
            name=req.name,
            role=req.role,
            organization=req.organization
        )
        return UserResponse(**new_u)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/users", response_model=List[UserResponse])
def get_all_users_list(admin_user: dict = Depends(get_admin_user)):
    """Lists all registered personnel accounts (Admin only)."""
    return [UserResponse(**u) for u in list_users()]


@router.delete("/users/{email}")
def remove_user(email: str, admin_user: dict = Depends(get_admin_user)):
    """Deletes an account (Admin only). Demo accounts are protected."""
    try:
        deleted = delete_user(email)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé.")
        return {"status": "success", "message": f"Utilisateur {email} supprimé avec succès."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/logout")
def logout(response: Response):
    """Logs out user by clearing the authentication cookie."""
    response.delete_cookie(key="in9ad_auth_token")
    return {"status": "success", "message": "Déconnexion réussie."}
