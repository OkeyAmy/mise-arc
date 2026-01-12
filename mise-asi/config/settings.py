"""
Configuration settings for mise-asi
Loads environment variables and provides configuration access
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    """Application settings loaded from environment"""
    
    # Flask
    PORT: int = int(os.getenv("PORT", "8001"))
    FLASK_ENV: str = os.getenv("FLASK_ENV", "development")
    DEBUG: bool = FLASK_ENV == "development"
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # ASI Cloud / LLM Provider
    ASICLOUD_API_KEY: str = os.getenv("ASICLOUD_API_KEY", "")
    ASICLOUD_BASE_URL: str = os.getenv("ASICLOUD_BASE_URL", "https://inference.asicloud.cudos.org/v1")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "openai/gpt-oss-20b")
    
    # Agent
    AGENT_SEED: str = os.getenv("AGENT_SEED", "mise-asi-default-seed")
    
    @classmethod
    def validate(cls) -> list[str]:
        """Validate required settings, returns list of missing vars"""
        missing = []
        if not cls.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not cls.SUPABASE_KEY:
            missing.append("SUPABASE_KEY")
        if not cls.ASICLOUD_API_KEY:
            missing.append("ASICLOUD_API_KEY")
        return missing


settings = Settings()
