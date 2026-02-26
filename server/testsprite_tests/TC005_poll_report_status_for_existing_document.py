import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_poll_report_status_for_existing_document():
    initialize_url = f"{BASE_URL}/api/reports/initialize"
    headers = {"Content-Type": "application/json"}
    payload = {
        "journey_type": "Established Seller",
        "product_info": {
            "product_name": "Test Product"
        },
        "answers": {
            "question_1": "answer_1",
            "question_2": "answer_2"
        }
    }
    # Create new report
    response = requests.post(
        initialize_url,
        json=payload,
        headers=headers,
        timeout=TIMEOUT
    )
    assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
    data = response.json()
    assert "documentId" in data, "documentId missing in response"
    document_id = data["documentId"]

    try:
        status_url = f"{BASE_URL}/api/reports/status/{document_id}"
        status_response = requests.get(
            status_url,
            headers=headers,
            timeout=TIMEOUT
        )
        assert status_response.status_code == 200, f"Expected 200 OK, got {status_response.status_code}"
        status_data = status_response.json()
        assert status_data.get("documentId") == document_id, "documentId mismatch in status response"
        assert status_data.get("status") == "draft", f"Expected status 'draft', got {status_data.get('status')}"
        assert status_data.get("progress") == 0, f"Expected progress 0, got {status_data.get('progress')}"
    finally:
        delete_url = f"{BASE_URL}/api/reports/{document_id}"
        try:
            requests.delete(
                delete_url,
                headers=headers,
                timeout=TIMEOUT
            )
        except Exception:
            pass

test_poll_report_status_for_existing_document()
