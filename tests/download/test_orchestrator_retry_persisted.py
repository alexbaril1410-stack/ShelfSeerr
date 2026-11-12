"""retry_persisted_download: what allow_request_linked lifts, and what it does not."""

from shelfmark.download import orchestrator


def _payload(**extra):
    """A minimal persisted payload for a request-linked download."""
    payload = {
        "task_id": "slskd:aa",
        "source": "slskd",
        "title": "Book",
        "request_id": 7,
    }
    payload.update(extra)
    return payload


def test_the_flag_still_refuses_a_download_with_nothing_to_restart_from():
    """allow_request_linked lifts the retry-from-requests rule, not the no-source rule."""
    ok, message = orchestrator.retry_persisted_download(
        _payload(can_retry_without_staged_source=False),
        final_status="error",
        allow_request_linked=True,
    )

    assert ok is False
    assert message == "Download cannot be retried"


def test_without_the_flag_a_request_linked_failure_goes_back_to_its_request():
    """Without the flag, a failed request download is retried from the request."""
    ok, message = orchestrator.retry_persisted_download(_payload(), final_status="error")

    assert ok is False
    assert message == "Request-linked downloads must be retried from requests"



def test_metadata_provider_identity_survives_retry_serialization():
    from shelfmark.core.models import DownloadTask

    task = DownloadTask(
        task_id="release-asin",
        source="prowlarr",
        title="Audible audiobook",
        metadata_provider="audible",
        metadata_provider_id="B08BKGYQXW",
        metadata_description="Audiobook description",
        metadata_publisher="Audible Studios",
        metadata_genres=["Fantasy"],
        metadata_isbn_13="9781234567890",
        metadata_language="fr",
        metadata_authors=["Author One"],
        metadata_narrators=["Narrator One"],
    )

    payload = orchestrator.serialize_task_for_retry(task)
    restored = orchestrator._restore_task_from_retry_payload(payload)

    assert restored is not None
    assert restored.metadata_provider == "audible"
    assert restored.metadata_provider_id == "B08BKGYQXW"
    assert restored.metadata_description == "Audiobook description"
    assert restored.metadata_publisher == "Audible Studios"
    assert restored.metadata_genres == ["Fantasy"]
    assert restored.metadata_isbn_13 == "9781234567890"
    assert restored.metadata_language == "fr"
    assert restored.metadata_authors == ["Author One"]
    assert restored.metadata_narrators == ["Narrator One"]
