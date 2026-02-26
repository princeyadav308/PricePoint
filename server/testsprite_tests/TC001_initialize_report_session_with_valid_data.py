import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_initialize_report_session_with_valid_data():
    initialize_url = f"{BASE_URL}/api/reports/initialize"
    status_url_template = f"{BASE_URL}/api/reports/status/{{}}"

    payload = {
        "journeyType": "Established Seller",
        "productInfo": {
            "productName": "Test Product",
            "category": "Electronics",
            "launchDate": "2025-06-01"
        },
        "answers": {
            "question1": "answer1",
            "question2": "answer2"
        }
    }

    document_id = None
    try:
        # POST /api/reports/initialize
        response = requests.post(
            initialize_url,
            json=payload,
            timeout=TIMEOUT
        )
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        resp_json = response.json()
        assert "documentId" in resp_json, "Response missing 'documentId'"
        assert "sessionId" in resp_json, "Response missing 'sessionId'"
        assert resp_json.get("initial_status") == "draft", f"Expected initial_status 'draft', got {resp_json.get('initial_status')}"

        document_id = resp_json["documentId"]
        session_id = resp_json["sessionId"]

        # GET /api/reports/status/:documentId
        status_url = status_url_template.format(document_id)
        status_response = requests.get(
            status_url,
            timeout=TIMEOUT
        )
        assert status_response.status_code == 200, f"Expected 200 OK on status check, got {status_response.status_code}"
        status_json = status_response.json()
        assert status_json.get("documentId") == document_id, "Status response documentId mismatch"
        assert status_json.get("status") == "draft", f"Expected status 'draft', got {status_json.get('status')}"
        assert status_json.get("sessionId") == session_id, "Status response sessionId mismatch"

    finally:
        # Cleanup if there was an endpoint to delete report - Not specified, skip cleanup
        pass

test_initialize_report_session_with_valid_data()
