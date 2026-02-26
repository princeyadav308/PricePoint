import requests

BASE_URL = "http://localhost:3000"


def test_create_dodo_checkout_session_with_valid_data():
    # Step 1: Initialize a new report session to get a valid documentId
    init_url = f"{BASE_URL}/api/reports/initialize"
    init_payload = {
        "journey_type": "Journey A",
        "product_info": {
            "product_id": "prod123",
            "name": "Test Product",
            "category": "categoryA"
        },
        "answers": {
            "question_1": "answer_1",
            "question_2": "answer_2"
        }
    }
    try:
        init_response = requests.post(
            init_url,
            json=init_payload,
            timeout=30
        )
        assert init_response.status_code == 201, f"Expected 201 Created, got {init_response.status_code}"
        init_data = init_response.json()
        assert "documentId" in init_data and init_data["documentId"], "documentId missing in initialize response"
        document_id = init_data["documentId"]

        # Step 2: Use the documentId to create a Dodo checkout session
        checkout_url = f"{BASE_URL}/api/checkout"
        checkout_payload = {
            "documentId": document_id,
            "tier": "premium",
            "price": 99.99,
            "return_url": "https://example.com/return"
        }
        checkout_response = requests.post(
            checkout_url,
            json=checkout_payload,
            timeout=30
        )
        assert checkout_response.status_code == 200, f"Expected 200 OK, got {checkout_response.status_code}"
        checkout_data = checkout_response.json()
        assert "checkout_id" in checkout_data and checkout_data["checkout_id"], "checkout_id missing in response"
        assert "checkout_url" in checkout_data and checkout_data["checkout_url"], "checkout_url missing in response"
        assert "expires_at" in checkout_data and checkout_data["expires_at"], "expires_at missing in response"
    finally:
        pass


test_create_dodo_checkout_session_with_valid_data()
