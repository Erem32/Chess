from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories import user_repository
from app.schemas.auth import LoginRequest, RegisterRequest


class UserAlreadyExistsError(Exception):
    """Raised when email or username is already registered."""


class InvalidCredentialsError(Exception):
    """Raised when login credentials cannot be verified."""


def create_password_hash(password: str) -> str:
    return hash_password(password)


def password_matches(password: str, hashed_password: str) -> bool:
    return verify_password(password, hashed_password)


def issue_access_token(user_id: int) -> str:
    return create_access_token(str(user_id))


def register_user(db: Session, payload: RegisterRequest) -> User:
    if user_repository.get_user_by_email(db, str(payload.email)):
        raise UserAlreadyExistsError
    if user_repository.get_user_by_username(db, payload.username):
        raise UserAlreadyExistsError

    try:
        return user_repository.create_user(
            db,
            username=payload.username,
            email=str(payload.email),
            hashed_password=create_password_hash(payload.password),
        )
    except IntegrityError as exc:
        db.rollback()
        raise UserAlreadyExistsError from exc


def authenticate_user(db: Session, username_or_email: str, password: str) -> User:
    user = user_repository.get_user_by_username_or_email(db, username_or_email)
    if user is None or not password_matches(password, user.hashed_password) or not user.is_active:
        raise InvalidCredentialsError
    return user


def login_user(db: Session, payload: LoginRequest) -> str:
    user = authenticate_user(db, payload.username_or_email, payload.password)
    return issue_access_token(user.id)
