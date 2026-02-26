import requests

BASE_URL = "http://localhost:3000"
WEBHOOK_ENDPOINT = "/api/webhooks/dodo"
REPORT_STATUS_ENDPOINT = "/api/reports/status/"

def test_dodo_payments_webhook_with_invalid_signature_or_payload():
    # Prepare invalid webhook payloads and headers
    invalid_payloads = [
        {},  # empty payload (malformed)
        {"random": "data"},  # unrelated payload
        {"checkout_id": "1234", "status": "paid"},  # missing required fields / no signature
        {"signature": "invalidsignature", "data": "corrupted"}  # invalid signature with data
    ]

    for payload in invalid_payloads:
        try:
            response = requests.post(
                f"{BASE_URL}{WEBHOOK_ENDPOINT}",
                json=payload,
                timeout=30
            )
        except requests.RequestException as e:
            assert False, f"Request failed with exception: {e}"

        # The API should return either 401 Unauthorized or 400 Bad Request
        assert response.status_code in (400, 401), \
            f"Expected 400 or 401, got {response.status_code} for payload {payload}"

    # Additionally, ensure no status update occurs; use a dummy documentId that would exist if updated
    # Here, since we have no valid documentId, we test a known invalid one to check no payment posted
    invalid_document_id = "non-existent-doc-id-0000"
    try:
        status_response = requests.get(
            f"{BASE_URL}{REPORT_STATUS_ENDPOINT}{invalid_document_id}",
            timeout=30
        )
    except requests.RequestException as e:
        assert False, f"Status request failed with exception: {e}"

    # It should return 404 Not Found or no indication of status update caused by webhook
    assert status_response.status_code == 404 or \
           (status_response.status_code == 200 and "paid" not in status_response.text.lower()), \
           "Status updated unexpectedly after invalid webhook"

test_dodo_payments_webhook_with_invalid_signature_or_payload()