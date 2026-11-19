"""Tests for the shared metadata cache."""

import threading
import time
from concurrent.futures import ThreadPoolExecutor

import pytest

from shelfmark.core.cache import CacheService


def test_cache_tracks_hits_misses_and_writes():
    cache = CacheService()
    assert cache.get("missing") is None
    cache.set("book:1", {"title": "Example"}, ttl=30)
    assert cache.get("book:1") == {"title": "Example"}

    stats = cache.stats()
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["writes"] == 1
    assert stats["size"] == 1


def test_expired_entries_are_removed_and_counted(monkeypatch: pytest.MonkeyPatch):
    now = [100.0]
    monkeypatch.setattr(time, "monotonic", lambda: now[0])
    cache = CacheService()
    cache.set("short-lived", "value", ttl=2)

    now[0] = 103.0
    assert cache.get("short-lived") is None
    assert cache.stats()["expirations"] == 1
    assert cache.stats()["size"] == 0


def test_cleanup_expired_removes_entries(monkeypatch: pytest.MonkeyPatch):
    now = [100.0]
    monkeypatch.setattr(time, "monotonic", lambda: now[0])
    cache = CacheService()
    cache.set("a", 1, ttl=1)
    cache.set("b", 2, ttl=10)

    now[0] = 102.0
    assert cache.cleanup_expired() == 1
    assert cache.get("a") is None
    assert cache.get("b") == 2


def test_set_evicts_entries_when_capacity_is_reached():
    cache = CacheService(max_size=2)
    cache.set("a", 1, ttl=60)
    cache.set("b", 2, ttl=60)
    cache.set("c", 3, ttl=60)

    stats = cache.stats()
    assert stats["size"] <= 2
    assert stats["evictions"] >= 1
    assert cache.get("c") == 3


def test_simultaneous_identical_misses_are_coalesced():
    cache = CacheService()
    started = threading.Event()
    release = threading.Event()
    calls = 0
    calls_lock = threading.Lock()

    def factory():
        nonlocal calls
        with calls_lock:
            calls += 1
        started.set()
        assert release.wait(timeout=2)
        return "shared-result"

    with ThreadPoolExecutor(max_workers=8) as executor:
        first = executor.submit(cache.get_or_compute, "same-key", factory, 30)
        assert started.wait(timeout=2)
        others = [
            executor.submit(cache.get_or_compute, "same-key", factory, 30)
            for _ in range(7)
        ]
        # Give the other workers a chance to register as waiters before release.
        deadline = time.monotonic() + 2
        while cache.stats()["coalesced_waits"] < 7 and time.monotonic() < deadline:
            time.sleep(0.005)
        release.set()
        results = [first.result(timeout=2), *(future.result(timeout=2) for future in others)]

    assert results == ["shared-result"] * 8
    assert calls == 1
    assert cache.stats()["coalesced_waits"] == 7


def test_failed_factory_releases_waiters_and_does_not_cache():
    cache = CacheService()
    started = threading.Event()
    release = threading.Event()
    calls = 0
    calls_lock = threading.Lock()

    def factory():
        nonlocal calls
        with calls_lock:
            calls += 1
            current_call = calls
        if current_call == 1:
            started.set()
            assert release.wait(timeout=2)
            raise RuntimeError("provider failed")
        return "recovered"

    with ThreadPoolExecutor(max_workers=2) as executor:
        first = executor.submit(cache.get_or_compute, "failure-key", factory, 30)
        assert started.wait(timeout=2)
        second = executor.submit(cache.get_or_compute, "failure-key", factory, 30)
        deadline = time.monotonic() + 2
        while cache.stats()["coalesced_waits"] < 1 and time.monotonic() < deadline:
            time.sleep(0.005)
        release.set()
        with pytest.raises(RuntimeError, match="provider failed"):
            first.result(timeout=2)
        assert second.result(timeout=2) == "recovered"

    assert calls == 2
    assert cache.get("failure-key") == "recovered"
