import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_dodo_payments_webhook_with_invalid_payload():
    # Step 1: Create a new report to get a valid documentId to check status later
    initialize_payload = {
        "journey_type": "Established Seller",
        "product_info": {"product_name": "Test Product", "category": "Electronics"},
        "answers": {"question1": "answer1", "question2": "answer2"}
    }
    try:
        resp_init = requests.post(
            f"{BASE_URL}/api/reports/initialize",
            json=initialize_payload,
            timeout=TIMEOUT
        )
        assert resp_init.status_code == 201, f"Expected 201 Created but got {resp_init.status_code}"
        data_init = resp_init.json()
        document_id = data_init.get("documentId")
        assert document_id, "No documentId returned from report initialization"

        # Step 2: Send invalid webhook payloads and assert response is 401 or 400
        invalid_payloads = [
            # Malformed payload (missing required fields)
            {"invalid": "data"},
            # Valid structure but invalid signature example (simulate by including 'signature' field wrong)
            {"event": "payment_succeeded", "documentId": document_id, "signature": "invalid_signature"},
            # Completely wrong type payload
            "this is not a json object",
            None
        ]

        for payload in invalid_payloads:
            headers = {"Content-Type": "application/json"}
            try:
                if payload is None:
                    response = requests.post(
                        f"{BASE_URL}/api/webhooks/dodo", 
                        data="",
                        headers=headers,
                        timeout=TIMEOUT
                    )
                elif isinstance(payload, str):
                    response = requests.post(
                        f"{BASE_URL}/api/webhooks/dodo",
                        data=payload,
                        headers=headers,
                        timeout=TIMEOUT
                    )
                else:
                    response = requests.post(
                        f"{BASE_URL}/api/webhooks/dodo",
                        json=payload,
                        timeout=TIMEOUT
                    )
            except requests.exceptions.JSONDecodeError:
                # malformed json in requests library handled here; treat as if server responds 400
                continue

            assert response.status_code in (400, 401), f"Expected 400 or 401 but got {response.status_code} for payload {payload}"

        # Step 3: Confirm report status has NOT been updated to any paid or generation state
        resp_status = requests.get(
            f"{BASE_URL}/api/reports/status/{document_id}",
            timeout=TIMEOUT
        )
        assert resp_status.status_code == 200, f"Expected 200 OK from status endpoint but got {resp_status.status_code}"
        status_data = resp_status.json()
        # The status should remain as initial like 'draft' (not 'paid' or 'generation_pending')
        assert status_data.get("status") == "draft", f"Report status changed unexpectedly to {status_data.get('status')}"

    finally:
        # Clean up: delete the created report to keep environment clean, if such endpoint existed
        # Not specified in PRD; here assume delete by DELETE /api/reports/:documentId if it existed
        # Since not specified, skip actual deletion step
        pass

test_dodo_payments_webhook_with_invalid_payload()
