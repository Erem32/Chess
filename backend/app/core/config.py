from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "Online Chess Platform"
    database_url: str = "postgresql+psycopg://online_chess_app:online_chess_dev_password@localhost:5432/online_chess"
    secret_key: str = "replace-with-a-long-random-development-secret"
    access_token_expire_minutes: int = 60
    backend_cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


settings = Settings()
