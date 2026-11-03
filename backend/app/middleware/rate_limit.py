"""
Simple sliding window rate limiter middleware
Uses Redis if available, falls back to in-memory
"""
import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests: int = None, window: int = None):
        super().__init__(app)
        self.requests = requests or settings.RATE_LIMIT_REQUESTS
        self.window = window or settings.RATE_LIMIT_PERIOD
        self.clients = defaultdict(list)  # in-memory fallback
        self._redis = None
        try:
            import redis as redis_lib
            self._redis = redis_lib.from_url(settings.RATE_LIMIT_STORAGE_URL, socket_connect_timeout=1)
            self._redis.ping()
        except Exception:
            self._redis = None

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for docs/health
        path = request.url.path
        if path in ("/", "/health", "/docs", "/redoc", "/openapi.json"):
            return await call_next(request)
        if path.startswith("/docs") or path.startswith("/redoc"):
            return await call_next(request)

        # Get client key
        client_ip = request.client.host if request.client else "unknown"
        key = f"rl:{client_ip}:{path}"

        now = time.time()
        allowed = False
        retry_after = 0

        if self._redis is not None:
            try:
                pipe = self._redis.pipeline()
                pipe.zremrangebyscore(key, 0, now - self.window)
                pipe.zcard(key)
                pipe.zadd(key, {str(now): now})
                pipe.expire(key, self.window)
                results = pipe.execute()
                count = results[1]
                if count < self.requests:
                    allowed = True
                else:
                    allowed = False
                    retry_after = int(self.window)
            except Exception:
                allowed = self._check_memory(key, now)
        else:
            allowed = self._check_memory(key, now)

        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Please try again later."},
                headers={"Retry-After": str(retry_after or self.window)},
            )

        response = await call_next(request)
        return response

    def _check_memory(self, key: str, now: float):
        # Clean old entries
        self.clients[key] = [t for t in self.clients[key] if now - t < self.window]
        if len(self.clients[key]) < self.requests:
            self.clients[key].append(now)
            return True
        return False
