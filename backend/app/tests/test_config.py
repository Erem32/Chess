import pytest
from pydantic import ValidationError

from app.core.config import DEVELOPMENT_SECRET_KEY, Settings


@pytest.fixture(autouse=True)
def clean_settings_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in (
        "APP_ENV", "DATABASE_URL", "SECRET_KEY", "ACCESS_TOKEN_EXPIRE_MINUTES",
        "BACKEND_CORS_ORIGINS", "ENABLE_DEV_SEED_USERS",
    ):
        monkeypatch.delenv(key, raising=False)


def production_settings(**overrides: object) -> Settings:
    values = {
        "app_env": "production",
        "database_url": "postgresql+psycopg://prod_user:prod_pass@db.example/chess",
        "secret_key": "abcdefghijklmnopqrstuvwxyz0123456789-EXAMPLE",
        "backend_cors_origins": "https://chess.example,https://play.chess.example:8443",
        "enable_dev_seed_users": False,
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)


def test_development_defaults_are_usable_without_seeding() -> None:
    settings = Settings(_env_file=None)
    assert settings.app_env == "development"
    assert not settings.enable_dev_seed_users


def test_valid_production_configuration() -> None:
    settings = production_settings()
    assert settings.app_env == "production"
    assert settings.cors_origins == ["https://chess.example", "https://play.chess.example:8443"]


@pytest.mark.parametrize("overrides", [
    {"secret_key": DEVELOPMENT_SECRET_KEY},
    {"secret_key": "local-preview-only-not-for-production"},
    {"secret_key": "short"},
    {"secret_key": "a" * 40},
    {"enable_dev_seed_users": True},
    {"database_url": "postgresql+psycopg://online_chess_app:online_chess_dev_password@db/chess"},
    {"backend_cors_origins": "http://localhost:5173"},
    {"backend_cors_origins": "https://*.example.com"},
    {"backend_cors_origins": "https://example.com/path"},
    {"backend_cors_origins": "https://example.com:invalid"},
    {"backend_cors_origins": ""},
    {"access_token_expire_minutes": 0},
])
def test_unsafe_production_configuration_is_rejected(overrides: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        production_settings(**overrides)


def test_typo_in_environment_is_rejected() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, app_env="produciton")


def test_validation_error_does_not_display_secrets() -> None:
    secret = "unique-secret-value-that-must-not-appear-in-error-output"
    with pytest.raises(ValidationError) as exc_info:
        production_settings(secret_key=secret, enable_dev_seed_users=True)
    assert secret not in str(exc_info.value)


def test_production_cannot_use_implicit_development_defaults() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, app_env="production")
