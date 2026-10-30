"""
IN9AD - Authentication Endpoints
Provides login, user self-management (My Profile), avatar updates, and Admin User CRUD.
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
    update_user_profile,
    admin_update_user,
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
    phone: Optional[str] = Field(None, example="+213 550 12 34 56")
    avatar: Optional[str] = Field(None, description="Optional Base64 avatar image string (max 2MB)")


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(None, example="Lieutenant Karim Belkacem")
    phone: Optional[str] = Field(None, example="+213 550 12 34 56")
    password: Optional[str] = Field(None, min_length=6, example="NewPassword123!")
    avatar: Optional[str] = Field(None, description="Base64 avatar image data URI (max 2MB)")


class AdminUpdateUserRequest(BaseModel):
    name: Optional[str] = Field(None, example="Capitaine Mohamed")
    role: Optional[str] = Field(None, example="CIVIL_PROTECTION")
    phone: Optional[str] = Field(None, example="+213 551 22 33 44")
    organization: Optional[str] = Field(None, example="Protection Civile Wilaya Bouira")
    password: Optional[str] = Field(None, min_length=6, example="ResetPwd2026!")
    avatar: Optional[str] = Field(None, description="Optional avatar data URI")


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    organization: Optional[str] = None
    organization_ar: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


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
        secure=False
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


@router.put("/me", response_model=UserResponse)
def update_my_profile(req: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    """
    Updates the authenticated user's own details (Name, Phone, Password, Avatar).
    CRITICAL: Email is strictly locked and cannot be changed.
    """
    try:
        updated = update_user_profile(
            email=current_user["email"],
            name=req.name,
            phone=req.phone,
            password=req.password,
            avatar=req.avatar
        )
        return UserResponse(**updated)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


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
            organization=req.organization,
            phone=req.phone,
            avatar=req.avatar
        )
        return UserResponse(**new_u)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/users", response_model=List[UserResponse])
def get_all_users_list(admin_user: dict = Depends(get_admin_user)):
    """Lists all registered personnel accounts (Admin only)."""
    return [UserResponse(**u) for u in list_users()]


@router.put("/users/{email}", response_model=UserResponse)
def edit_user_by_admin(
    email: str,
    req: AdminUpdateUserRequest,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Edits any user account (Admin only).
    CRITICAL: Email is immutable and cannot be altered.
    """
    try:
        updated = admin_update_user(
            email=email,
            name=req.name,
            role=req.role,
            phone=req.phone,
            organization=req.organization,
            password=req.password,
            avatar=req.avatar
        )
        return UserResponse(**updated)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/users/{email}")
def remove_user(email: str, admin_user: dict = Depends(get_admin_user)):
    """
    Deletes an account (Admin only).
    CRITICAL: The primary Super Admin account (admin@in9ad.dz) CANNOT be deleted (returns 403).
    Other Admin accounts CAN be deleted.
    """
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
