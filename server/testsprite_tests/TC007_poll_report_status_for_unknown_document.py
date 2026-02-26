import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
USERNAME = "princeyadav308@gmail.com"
PASSWORD = "Captain"

def test_poll_report_status_for_unknown_document():
    unknown_document_id = "unknown-doc-1234"
    url = f"{BASE_URL}/api/reports/status/{unknown_document_id}"
    try:
        response = requests.get(url, auth=HTTPBasicAuth(USERNAME, PASSWORD), timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 404, f"Expected status code 404, got {response.status_code}"
    json_resp = {}
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"
    error_message = json_resp.get("error") or json_resp.get("message") or ""
    assert "not found" in error_message.lower(), f"Expected error message indicating document not found, got: {error_message}"

test_poll_report_status_for_unknown_document()