"""
Process-local TTL cache with the exact interface a Redis client would need
(get/set with an expiry), so swapping to Redis in a multi-instance deployment
is a one-file change: replace `CacheStore` with a thin wrapper around
`redis.Redis.get/setex`, keep `cached(ttl=...)` untouched.
"""
import time
import threading
import functools
import hashlib
import json


class CacheStore:
    def __init__(self):
        self._data = {}
        self._lock = threading.Lock()

    def get(self, key):
        with self._lock:
            entry = self._data.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if expires_at < time.time():
                del self._data[key]
                return None
            return value

    def set(self, key, value, ttl):
        with self._lock:
            self._data[key] = (value, time.time() + ttl)


store = CacheStore()


def _make_key(prefix, args, kwargs):
    raw = json.dumps({"a": args, "k": kwargs}, sort_keys=True, default=str)
    digest = hashlib.sha1(raw.encode()).hexdigest()[:16]
    return f"{prefix}:{digest}"


def cached(ttl):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            key = _make_key(fn.__qualname__, args, kwargs)
            hit = store.get(key)
            if hit is not None:
                return hit
            result = fn(*args, **kwargs)
            store.set(key, result, ttl)
            return result
        return wrapper
    return decorator
