import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def test_create_dodo_checkout_session_with_invalid_data():
    # Step 1: Initialize a valid report session to get a valid documentId
    init_payload = {
        "journey_type": "Established Seller",
        "product_info": {"name": "Test Product", "category": "Test Category"},
        "answers": {"q1": "a1", "q2": "a2"}
    }

    response_init = requests.post(
        f"{BASE_URL}/api/reports/initialize",
        json=init_payload,
        timeout=TIMEOUT
    )
    assert response_init.status_code == 201
    init_data = response_init.json()
    document_id = init_data.get("documentId")
    assert document_id

    try:
        # Test 1: POST /api/checkout with invalid documentId
        invalid_doc_payload = {
            "documentId": "invalid-document-id",
            "tier": "premium",
            "price": 1000,
            "return_url": "http://localhost/return"
        }
        response_invalid_doc = requests.post(
            f"{BASE_URL}/api/checkout",
            json=invalid_doc_payload,
            timeout=TIMEOUT
        )
        assert response_invalid_doc.status_code == 400
        error_resp_1 = response_invalid_doc.json()
        assert "error" in error_resp_1

        # Test 2: POST /api/checkout with unsupported tier
        invalid_tier_payload = {
            "documentId": document_id,
            "tier": "unsupported-tier",
            "price": 500,
            "return_url": "http://localhost/return"
        }
        response_invalid_tier = requests.post(
            f"{BASE_URL}/api/checkout",
            json=invalid_tier_payload,
            timeout=TIMEOUT
        )
        assert response_invalid_tier.status_code == 400
        error_resp_2 = response_invalid_tier.json()
        assert "error" in error_resp_2

    finally:
        # Clean up by deleting the created report if possible
        # No delete endpoint described in PRD, so skipping actual delete call
        pass


test_create_dodo_checkout_session_with_invalid_data()
