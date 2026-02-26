import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_create_dodo_checkout_session_with_invalid_documentid_or_tier():
    # Use invalid documentId and invalid tier to trigger 400 Bad Request
    url = f"{BASE_URL}/api/checkout"
    headers = {
        "Content-Type": "application/json"
    }

    # Invalid payloads to test both invalid documentId and unsupported tier
    test_payloads = [
        {
            "documentId": "invalid-doc-id",  # invalid documentId
            "tier": "Professional",
            "price": 100,
            "return_url": "http://localhost/return"
        },
        {
            # Assume a valid-ish documentId format but unsupported tier
            "documentId": "123e4567-e89b-12d3-a456-426614174000",
            "tier": "UnsupportedTier",
            "price": 100,
            "return_url": "http://localhost/return"
        },
        {
            # Both documentId and tier invalid
            "documentId": "bad-doc-id",
            "tier": "NoTier",
            "price": 100,
            "return_url": "http://localhost/return"
        }
    ]

    for payload in test_payloads:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 400, f"Expected 400 Bad Request, got {response.status_code}"
        json_resp = response.json()
        assert "error" in json_resp or "message" in json_resp, "Expected error message in response"
        error_msg = json_resp.get("error") or json_resp.get("message")
        assert ("invalid documentId" in error_msg.lower() or "invalid tier" in error_msg.lower() or
                "unsupported tier" in error_msg.lower()), f"Error message does not indicate invalid documentId or tier: {error_msg}"

test_create_dodo_checkout_session_with_invalid_documentid_or_tier()