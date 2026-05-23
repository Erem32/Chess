from app.core.security import create_access_token, decode_access_token, hash_password, verify_password


def test_password_hashing_works() -> None:
    hashed = hash_password("secret")

    assert hashed != "secret"
    assert verify_password("secret", hashed)
    assert not verify_password("wrong", hashed)


def test_jwt_creation_and_validation_works() -> None:
    token = create_access_token("123")
    payload = decode_access_token(token)

    assert payload["sub"] == "123"
