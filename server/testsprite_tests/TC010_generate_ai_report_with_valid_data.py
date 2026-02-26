import requests
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_generate_ai_report_with_valid_data():
    headers = {"Content-Type": "application/json"}

    # Step1: Create a new report session to get a documentId
    initialize_payload = {
        "journey_type": "Journey A",
        "product_info": {"name": "Sample Product", "category": "Sample Category"},
        "answers": {"q1": "answer1", "q2": "answer2"}
    }

    # POST /api/reports/initialize
    init_url = f"{BASE_URL}/api/reports/initialize"
    try:
        init_response = requests.post(init_url, json=initialize_payload, headers=headers, timeout=TIMEOUT)
        assert init_response.status_code == 201, f"Expected 201, got {init_response.status_code}"
        init_data = init_response.json()
        assert "documentId" in init_data and init_data["documentId"], "documentId missing in response"
        assert "sessionId" in init_data and init_data["sessionId"], "sessionId missing in response"
        assert init_data.get("initial_status") == "draft", f"Expected initial_status 'draft', got {init_data.get('initial_status')}"

        document_id = init_data["documentId"]

        # Step 2: POST /api/generate-report with valid documentId and session_data
        generate_payload = {
            "documentId": document_id,
            "session_data": {
                "userPreferences": {"theme": "dark"},
                "responses": {"q1": "yes", "q2": "no"}
            }
        }

        gen_url = f"{BASE_URL}/api/generate-report"
        gen_response = requests.post(gen_url, json=generate_payload, headers=headers, timeout=TIMEOUT)
        assert gen_response.status_code == 202, f"Expected 202, got {gen_response.status_code}"
        gen_data = gen_response.json()
        assert "jobId" in gen_data and gen_data["jobId"], "jobId missing in response"
        assert gen_data.get("documentId") == document_id, "documentId mismatch in response"
        assert gen_data.get("status") == "generation_started", f"Expected status 'generation_started', got {gen_data.get('status')}"

        # Step 3: Poll GET /api/reports/status/:documentId until status is 'ready' or timeout
        status_url = f"{BASE_URL}/api/reports/status/{document_id}"
        max_retries = 10
        delay_seconds = 3
        for _ in range(max_retries):
            status_response = requests.get(status_url, headers=headers, timeout=TIMEOUT)
            assert status_response.status_code == 200, f"Expected 200, got {status_response.status_code}"
            status_data = status_response.json()
            if status_data.get("status") == "ready":
                # Verify report metadata presence
                report = status_data.get("report")
                assert report is not None, "Report metadata missing when status is 'ready'"
                assert "report_id" in report and report["report_id"], "report_id missing in report metadata"
                # document_id in report might be named document_id or documentId
                assert report.get("document_id") == document_id or report.get("documentId") == document_id, "documentId mismatch in report metadata"
                assert "download_url" in report and report["download_url"], "download_url missing in report metadata"
                assert "generated_at" in report and report["generated_at"], "generated_at missing in report metadata"
                break
            time.sleep(delay_seconds)
        else:
            assert False, f"Report status did not become 'ready' within expected time"

    finally:
        # Cleanup: Delete the report if API allows deletion - Not specified in PRD, so skip if unknown
        pass

test_generate_ai_report_with_valid_data()
