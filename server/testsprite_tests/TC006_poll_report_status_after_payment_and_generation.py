import requests
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_poll_report_status_after_payment_and_generation():
    # Step 1: Initialize a new report session to get a documentId
    initialize_payload = {
        "journey_type": "Established Seller",
        "product_info": {"product_name": "Test Product", "category": "Test Category"},
        "answers": {"q1": "answer1", "q2": "answer2"}
    }

    document_id = None
    try:
        init_resp = requests.post(
            f"{BASE_URL}/api/reports/initialize",
            json=initialize_payload,
            timeout=TIMEOUT
        )
        assert init_resp.status_code == 201, f"Expected 201, got {init_resp.status_code}"
        init_data = init_resp.json()
        assert "documentId" in init_data, "documentId missing in initialization response"
        document_id = init_data["documentId"]

        # Step 2: Create Dodo Checkout Session for the report purchase
        checkout_payload = {
            "documentId": document_id,
            "tier": "premium",
            "price": 199.99,
            "return_url": "http://localhost:3000/return"
        }
        checkout_resp = requests.post(
            f"{BASE_URL}/api/checkout",
            json=checkout_payload,
            timeout=TIMEOUT
        )
        assert checkout_resp.status_code == 200, f"Expected 200 on checkout, got {checkout_resp.status_code}"
        checkout_data = checkout_resp.json()
        assert "checkout_id" in checkout_data and "checkout_url" in checkout_data and "expires_at" in checkout_data

        # Step 3: Simulate payment webhook call with a valid payment success payload
        webhook_payload = {
            "event": "payment_succeeded",
            "data": {
                "documentId": document_id,
                "tier": "premium",
                "amount": 199.99,
                "currency": "USD",
                "payment_id": "test_payment_1234",
                "status": "succeeded"
            },
            "signature": "valid_signature"
        }

        webhook_resp = requests.post(
            f"{BASE_URL}/api/webhooks/dodo",
            json=webhook_payload,
            timeout=TIMEOUT
        )
        assert webhook_resp.status_code == 200, f"Expected 200 on webhook, got {webhook_resp.status_code}"

        # Step 4: Trigger report generation via generate-report endpoint
        gen_payload = {
            "documentId": document_id,
            "session_data": initialize_payload
        }
        gen_resp = requests.post(
            f"{BASE_URL}/api/generate-report",
            json=gen_payload,
            timeout=TIMEOUT
        )
        assert gen_resp.status_code == 202, f"Expected 202 on generate-report, got {gen_resp.status_code}"
        gen_data = gen_resp.json()
        assert gen_data.get("status") == "generation_started"
        assert gen_data.get("documentId") == document_id
        assert "jobId" in gen_data

        # Step 5: Poll GET /api/reports/status/:documentId until status is 'ready' or timeout
        max_retries = 15
        for attempt in range(max_retries):
            status_resp = requests.get(
                f"{BASE_URL}/api/reports/status/{document_id}",
                timeout=TIMEOUT
            )
            assert status_resp.status_code == 200, f"Expected 200 on status poll, got {status_resp.status_code}"
            status_data = status_resp.json()
            if status_data.get("status") == "ready":
                report = status_data.get("report")
                assert report is not None, "Report metadata missing when status is 'ready'"
                for field in ["report_id", "document_id", "download_url", "generated_at"]:
                    assert field in report, f"'{field}' missing in report metadata"
                assert report["document_id"] == document_id
                break
            else:
                time.sleep(2)
        else:
            assert False, "Report status never reached 'ready' within timeout"

    finally:
        pass

test_poll_report_status_after_payment_and_generation()