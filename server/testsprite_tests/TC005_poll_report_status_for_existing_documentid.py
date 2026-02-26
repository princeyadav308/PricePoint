import requests

BASE_URL = "http://localhost:3000"
AUTH_HEADER = {"Authorization": "Bearer test-bypass-token-123"}
TIMEOUT = 30

def test_poll_report_status_for_existing_documentid():
    # Step 1: Initialize a new report to get documentId
    initialize_url = f"{BASE_URL}/api/reports/initialize"
    initialize_payload = {
        "journey_type": "Journey A",
        "product_info": {"product_category": "electronics", "product_name": "widget"},
        "answers": {"q1": "a1", "q2": "a2"}
    }
    headers = AUTH_HEADER.copy()
    headers["Content-Type"] = "application/json"

    document_id = None
    try:
        init_resp = requests.post(
            initialize_url,
            json=initialize_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert init_resp.status_code == 201, f"Expected 201 Created, got {init_resp.status_code}"
        init_json = init_resp.json()
        assert "documentId" in init_json, "Response missing 'documentId'"
        assert "sessionId" in init_json, "Response missing 'sessionId'"
        assert init_json.get("initial_status") == "draft", f"Expected initial_status 'draft', got {init_json.get('initial_status')}"
        document_id = init_json["documentId"]

        # Step 2: Poll report status for the created documentId
        status_url = f"{BASE_URL}/api/reports/status/{document_id}"
        status_resp = requests.get(status_url, timeout=TIMEOUT)
        assert status_resp.status_code == 200, f"Expected 200 OK, got {status_resp.status_code}"
        status_json = status_resp.json()

        # Validate keys and values
        assert status_json.get("documentId") == document_id, "documentId mismatch in status response"
        assert status_json.get("status") == "draft", f"Expected status 'draft', got {status_json.get('status')}"
        assert status_json.get("progress") == 0, f"Expected progress 0, got {status_json.get('progress')}"
    finally:
        # Cleanup: delete the created report to maintain test isolation
        if document_id:
            delete_url = f"{BASE_URL}/api/reports/status/{document_id}"
            try:
                requests.delete(delete_url, timeout=TIMEOUT)
            except Exception:
                pass

test_poll_report_status_for_existing_documentid()
