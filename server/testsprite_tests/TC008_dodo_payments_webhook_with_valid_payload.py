import requests
from requests.auth import HTTPBasicAuth
import time

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("princeyadav308@gmail.com", "Captain")
TIMEOUT = 30

def test_dodo_payments_webhook_with_valid_payload():
    # Step 1: Initialize a new report session to obtain a documentId
    initialize_payload = {
        "journey_type": "Established Seller",
        "product_info": {"product_id": "12345"},
        "answers": {}
    }

    try:
        init_resp = requests.post(
            f"{BASE_URL}/api/reports/initialize",
            json=initialize_payload,
            timeout=TIMEOUT
        )
        assert init_resp.status_code == 201, f"Initialize report failed with status {init_resp.status_code}"
        init_data = init_resp.json()
        document_id = init_data.get("documentId")
        assert isinstance(document_id, str) and document_id.strip() != "", "documentId missing or invalid in init response"

        # Step 2: Prepare a valid signed payment success payload for the webhook
        webhook_payload = {
            "event": "payment_succeeded",
            "data": {
                "documentId": document_id,
                "checkout_id": "chk_1234567890",
                "payment_status": "succeeded",
                "amount": 100,
                "currency": "USD"
            },
            "signature": "valid_signature_example"
        }

        # Step 3: POST to /api/webhooks/dodo with the valid payload
        webhook_resp = requests.post(
            f"{BASE_URL}/api/webhooks/dodo",
            json=webhook_payload,
            timeout=TIMEOUT
        )
        assert webhook_resp.status_code == 200, f"Webhook endpoint did not return 200 OK, got {webhook_resp.status_code}"

        # Step 4: Poll /api/reports/status/:documentId to check updated report status
        max_retries = 5
        status_updated = False
        for _ in range(max_retries):
            status_resp = requests.get(
                f"{BASE_URL}/api/reports/status/{document_id}",
                timeout=TIMEOUT
            )
            if status_resp.status_code == 200:
                status_data = status_resp.json()
                status = status_data.get("status", "").lower()
                if status in ["paid", "generation_pending"]:
                    status_updated = True
                    break
            time.sleep(1)

        assert status_updated, "Report status did not update to 'paid' or 'generation_pending' after webhook call"

    finally:
        pass

test_dodo_payments_webhook_with_valid_payload()
