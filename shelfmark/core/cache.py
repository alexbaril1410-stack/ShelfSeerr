"""Thread-safe in-memory cache with TTL support and request coalescing."""

import threading
import time
from dataclasses import dataclass
from functools import wraps
from typing import TYPE_CHECKING, ParamSpec, TypeVar, cast

from shelfmark.core.logger import setup_logger

if TYPE_CHECKING:
    from collections.abc import Callable

logger = setup_logger(__name__)

P = ParamSpec("P")
R = TypeVar("R")


@dataclass
class CacheEntry:
    """A cached value with expiration time."""

    value: object
    expires_at: float


class CacheService:
    """Thread-safe in-memory cache with TTL support and per-key request coalescing."""

    def __init__(self, max_size: int = 1000) -> None:
        """Initialize cache with max_size entries before eviction."""
        if max_size < 1:
            raise ValueError("max_size must be at least 1")
        self._cache: dict[str, CacheEntry] = {}
        self._inflight: dict[str, threading.Event] = {}
        self._lock = threading.Lock()
        self._max_size = max_size
        self._metrics = {
            "hits": 0,
            "misses": 0,
            "writes": 0,
            "expirations": 0,
            "evictions": 0,
            "coalesced_waits": 0,
        }

    def get(self, key: str) -> object | None:
        """Get cached value if present and not expired."""
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                self._metrics["misses"] += 1
                return None

            if time.monotonic() >= entry.expires_at:
                del self._cache[key]
                self._metrics["expirations"] += 1
                self._metrics["misses"] += 1
                return None

            self._metrics["hits"] += 1
            return entry.value

    def set(self, key: str, value: object, ttl: int) -> None:
        """Cache value with TTL in seconds."""
        if ttl <= 0:
            return
        with self._lock:
            # Remove expired entries before evicting live values.
            self._cleanup_expired_locked()
            if key not in self._cache and len(self._cache) >= self._max_size:
                self._evict_oldest()
            self._cache[key] = CacheEntry(value=value, expires_at=time.monotonic() + ttl)
            self._metrics["writes"] += 1

    def get_or_compute(self, key: str, factory: Callable[[], R], ttl: int) -> R:
        """Return a cached value, coalescing concurrent computations for the same key."""
        while True:
            with self._lock:
                entry = self._cache.get(key)
                if entry is not None:
                    if time.monotonic() < entry.expires_at:
                        self._metrics["hits"] += 1
                        return cast("R", entry.value)
                    del self._cache[key]
                    self._metrics["expirations"] += 1

                event = self._inflight.get(key)
                if event is None:
                    event = threading.Event()
                    self._inflight[key] = event
                    self._metrics["misses"] += 1
                    is_owner = True
                else:
                    self._metrics["coalesced_waits"] += 1
                    is_owner = False

            if not is_owner:
                event.wait()
                # The owner may have failed or returned None; retry safely.
                continue

            try:
                result = factory()
                if result is not None:
                    self.set(key, result, ttl)
                return result
            finally:
                with self._lock:
                    completed = self._inflight.pop(key, None)
                    if completed is not None:
                        completed.set()

    def invalidate(self, key: str) -> bool:
        """Remove specific cache entry. Returns True if found."""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def invalidate_prefix(self, prefix: str) -> int:
        """Remove all cache entries whose keys start with prefix."""
        with self._lock:
            matching_keys = [key for key in self._cache if key.startswith(prefix)]
            for key in matching_keys:
                del self._cache[key]
            return len(matching_keys)

    def clear(self) -> None:
        """Clear all cache entries without resetting lifetime statistics."""
        with self._lock:
            self._cache.clear()

    def _cleanup_expired_locked(self) -> int:
        """Remove expired entries. Called with lock held."""
        now = time.monotonic()
        expired_keys = [key for key, entry in self._cache.items() if entry.expires_at <= now]
        for key in expired_keys:
            del self._cache[key]
        self._metrics["expirations"] += len(expired_keys)
        return len(expired_keys)

    def cleanup_expired(self) -> int:
        """Remove all expired entries. Returns count removed."""
        with self._lock:
            return self._cleanup_expired_locked()

    def _evict_oldest(self) -> None:
        """Evict ~10% of entries with the nearest expiration. Called with lock held."""
        if not self._cache:
            return
        entries_to_remove = max(1, len(self._cache) // 10)
        sorted_entries = sorted(self._cache.items(), key=lambda item: item[1].expires_at)
        for key, _ in sorted_entries[:entries_to_remove]:
            del self._cache[key]
        self._metrics["evictions"] += min(entries_to_remove, len(sorted_entries))

    def stats(self) -> dict[str, int]:
        """Get cache size, capacity, and cumulative activity counters."""
        with self._lock:
            return {
                "size": len(self._cache),
                "max_size": self._max_size,
                **self._metrics,
            }


# Global cache instance for metadata providers
_metadata_cache = CacheService(max_size=1000)


def get_metadata_cache() -> CacheService:
    """Get the global metadata cache instance."""
    return _metadata_cache


def cache_key(*args: object, **kwargs: object) -> str:
    """Generate cache key from arguments."""
    parts = [str(arg) for arg in args]
    parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
    return ":".join(parts)


def _coerce_ttl_seconds(value: object, *, default: int) -> int:
    """Normalize cache TTL values read from config or decorator arguments."""
    if isinstance(value, bool):
        return default
    if isinstance(value, int):
        return value if value > 0 else default
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.isdigit():
            parsed = int(stripped)
            return parsed if parsed > 0 else default
    return default


def cacheable(
    ttl: int | None = None,
    ttl_key: str | None = None,
    ttl_default: int = 300,
    key_prefix: str = "",
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Cache function results with a static or config-backed TTL."""

    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            from shelfmark.core.config import config

            if not config.get("METADATA_CACHE_ENABLED", True):
                return func(*args, **kwargs)

            if ttl is not None:
                effective_ttl = ttl
            elif ttl_key:
                effective_ttl = _coerce_ttl_seconds(
                    config.get(ttl_key, ttl_default),
                    default=ttl_default,
                )
            else:
                effective_ttl = ttl_default

            # Skip 'self' for instance methods so cache identity is provider-independent.
            cache_args = args[1:] if args and hasattr(args[0], func.__name__) else args
            key = cache_key(key_prefix or func.__name__, *cache_args, **kwargs)
            return _metadata_cache.get_or_compute(
                key,
                lambda: func(*args, **kwargs),
                effective_ttl,
            )

        return wrapper

    return decorator
