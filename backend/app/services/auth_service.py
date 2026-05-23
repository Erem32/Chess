from app.core.security import create_access_token, hash_password, verify_password


def create_password_hash(password: str) -> str:
    return hash_password(password)


def password_matches(password: str, hashed_password: str) -> bool:
    return verify_password(password, hashed_password)


def issue_access_token(user_id: int) -> str:
    return create_access_token(str(user_id))
