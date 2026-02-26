import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_poll_report_status_with_unknown_documentid():
    unknown_document_id = "nonexistent-document-id-12345"
    url = f"{BASE_URL}/api/reports/status/{unknown_document_id}"

    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

    assert response.status_code == 404, f"Expected 404 Not Found, got {response.status_code}"
    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not JSON"

    error_message = json_data.get("error") or json_data.get("message") or json_data.get("detail")
    assert error_message, "Error message not found in response"
    assert "document not found" in error_message.lower() or "report not found" in error_message.lower(), f"Unexpected error message: {error_message}"

test_poll_report_status_with_unknown_documentid()