from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


DEVELOPMENT_DATABASE_URL = "postgresql+psycopg://online_chess_app:online_chess_dev_password@localhost:5432/online_chess"
DEVELOPMENT_SECRET_KEY = "replace-with-a-long-random-development-secret"


class Settings(BaseSettings):
    app_env: Literal["development", "production"] = "development"
    project_name: str = "Online Chess Platform"
    database_url: str = DEVELOPMENT_DATABASE_URL
    secret_key: str = DEVELOPMENT_SECRET_KEY
    access_token_expire_minutes: int = Field(default=60, gt=0)
    backend_cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    enable_dev_seed_users: bool = False

    # Validation failures can otherwise print supplied secrets in startup logs.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", hide_input_in_errors=True)

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.app_env != "production":
            return self

        if self.enable_dev_seed_users:
            raise ValueError("Development user seeding must be disabled in production")
        if (
            len(self.secret_key) < 32
            or self.secret_key in {DEVELOPMENT_SECRET_KEY, "local-preview-only-not-for-production"}
            or self.secret_key.strip() != self.secret_key
            or len(set(self.secret_key)) < 8
        ):
            raise ValueError("Production SECRET_KEY must be a distinct, strong random secret of at least 32 characters")
        if self.database_url == DEVELOPMENT_DATABASE_URL or "online_chess_dev_password" in self.database_url:
            raise ValueError("Production DATABASE_URL must not use development database credentials")
        if not self.cors_origins or any(not _is_https_origin(origin) for origin in self.cors_origins):
            raise ValueError("Production BACKEND_CORS_ORIGINS must list explicit HTTPS origins")
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


def _is_https_origin(value: str) -> bool:
    try:
        parsed = urlsplit(value)
        return bool(
            parsed.scheme == "https"
            and parsed.hostname
            and parsed.hostname != "*"
            and "*" not in parsed.netloc
            and parsed.username is None
            and parsed.password is None
            and not parsed.path
            and not parsed.query
            and not parsed.fragment
            and (parsed.port is None or 0 < parsed.port <= 65535)
        )
    except ValueError:
        return False


settings = Settings()
