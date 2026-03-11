from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    google_client_id: str
    # running in development? affects cookie security
    debug: bool = True
    # comma-separated allowed origins for CORS
    cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        frozen=True,
    )

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()