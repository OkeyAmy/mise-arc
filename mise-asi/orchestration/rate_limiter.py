"""
Rate Limiter for API Calls
Prevents hitting Gemini API quota limits on free tier.
"""
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import deque
from threading import Lock

from utils import get_logger

logger = get_logger(__name__)


@dataclass
class RateLimiter:
    """
    Simple rate limiter for API calls.
    
    Gemini free tier limits:
    - 15 requests per minute (RPM)
    - 1500 requests per day (RPD)
    - 1 million tokens per minute (TPM)
    """
    max_requests_per_minute: int = 10  # Conservative limit
    max_requests_per_day: int = 1000   # Conservative limit
    
    # Track request timestamps
    minute_requests: deque = field(default_factory=deque)
    day_requests: deque = field(default_factory=deque)
    
    # Thread safety
    lock: Lock = field(default_factory=Lock)
    
    def wait_if_needed(self) -> float:
        """
        Wait if we're hitting rate limits.
        Returns the number of seconds waited.
        """
        with self.lock:
            now = datetime.now()
            one_minute_ago = now - timedelta(minutes=1)
            one_day_ago = now - timedelta(days=1)
            
            # Clean up old timestamps
            while self.minute_requests and self.minute_requests[0] < one_minute_ago:
                self.minute_requests.popleft()
            while self.day_requests and self.day_requests[0] < one_day_ago:
                self.day_requests.popleft()
            
            wait_time = 0.0
            
            # Check minute limit
            if len(self.minute_requests) >= self.max_requests_per_minute:
                # Wait until the oldest request in the window expires
                oldest = self.minute_requests[0]
                wait_until = oldest + timedelta(minutes=1)
                wait_time = max(0, (wait_until - now).total_seconds())
                
                if wait_time > 0:
                    logger.warning(f"Rate limit: waiting {wait_time:.1f}s (minute limit)")
                    time.sleep(wait_time)
                    
                    # Clean up after waiting
                    now = datetime.now()
                    one_minute_ago = now - timedelta(minutes=1)
                    while self.minute_requests and self.minute_requests[0] < one_minute_ago:
                        self.minute_requests.popleft()
            
            # Check day limit
            if len(self.day_requests) >= self.max_requests_per_day:
                logger.error("Daily rate limit reached! Cannot make more API calls today.")
                raise RateLimitExceededError("Daily API quota exceeded. Please try again tomorrow.")
            
            # Record this request
            now = datetime.now()
            self.minute_requests.append(now)
            self.day_requests.append(now)
            
            return wait_time
    
    def get_usage_stats(self) -> dict:
        """Get current usage statistics"""
        now = datetime.now()
        one_minute_ago = now - timedelta(minutes=1)
        one_day_ago = now - timedelta(days=1)
        
        with self.lock:
            minute_count = sum(1 for ts in self.minute_requests if ts >= one_minute_ago)
            day_count = sum(1 for ts in self.day_requests if ts >= one_day_ago)
        
        return {
            "requests_this_minute": minute_count,
            "requests_today": day_count,
            "minute_limit": self.max_requests_per_minute,
            "day_limit": self.max_requests_per_day,
            "minute_remaining": max(0, self.max_requests_per_minute - minute_count),
            "day_remaining": max(0, self.max_requests_per_day - day_count),
        }


class RateLimitExceededError(Exception):
    """Raised when API rate limit is exceeded"""
    pass


# Singleton instance
_rate_limiter: RateLimiter | None = None


def get_rate_limiter() -> RateLimiter:
    """Get or create rate limiter singleton"""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter
