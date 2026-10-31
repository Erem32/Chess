from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(min_length=1)

    @field_validator("username")
    @classmethod
    def username_not_blank(cls, value: str) -> str:
        if not value.strip() or "\x00" in value:
            raise ValueError("Username cannot be blank or contain null bytes")
        return value

    @field_validator("password")
    @classmethod
    def password_within_bcrypt_limits(cls, value: str) -> str:
        try:
            encoded = value.encode("utf-8")
        except UnicodeEncodeError as exc:
            raise ValueError("Password must be valid UTF-8") from exc
        if "\x00" in value or len(encoded) > 72:
            raise ValueError("Password must not contain null bytes or exceed 72 UTF-8 bytes")
        return value


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class RegisterResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
