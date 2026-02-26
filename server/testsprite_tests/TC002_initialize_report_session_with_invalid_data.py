import requests

BASE_URL = "http://localhost:3000"
ENDPOINT = "/api/reports/initialize"
TIMEOUT = 30

def test_initialize_report_session_with_invalid_data():
    url = BASE_URL + ENDPOINT
    headers = {"Content-Type": "application/json"}

    invalid_payloads = [
        # Missing required fields 'journey_type'
        {
            "product_info": {},
            "answers": {}
        },
        # journey_type wrong type
        {
            "journey_type": 123,
            "product_info": {},
            "answers": {}
        },
        # product_info missing
        {
            "journey_type": "Journey A",
            "answers": {}
        },
        # answers missing
        {
            "journey_type": "Journey B",
            "product_info": {}
        },
        # journey_type empty string
        {
            "journey_type": "",
            "product_info": {},
            "answers": {}
        },
        # product_info wrong type
        {
            "journey_type": "Journey A",
            "product_info": "not an object",
            "answers": {}
        },
        # answers wrong type
        {
            "journey_type": "Journey B",
            "product_info": {},
            "answers": []
        },
        # completely empty payload
        {}
    ]

    for payload in invalid_payloads:
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request failed with exception: {e}"

        assert response.status_code == 400, f"Expected 400 Bad Request, got {response.status_code} for payload: {payload}"

        try:
            resp_json = response.json()
        except ValueError:
            assert False, "Response is not valid JSON"

        assert "error" in resp_json or "errors" in resp_json or "message" in resp_json, (
            f"Response JSON lacks validation error info for payload: {payload}"
        )

test_initialize_report_session_with_invalid_data()
