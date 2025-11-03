import os
import sys

# Ensure repo root is on sys.path so `src.app` can be imported when tests run
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from fastapi.testclient import TestClient
from src.app import app


client = TestClient(app)


def test_get_activities():
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    # Expect some known activity keys from the in-memory store
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"].get("participants"), list)


def test_signup_and_unregister():
    activity = "Chess Club"
    test_email = "test_student@example.com"

    # Ensure the test email is not present to start
    r0 = client.get("/activities")
    assert r0.status_code == 200
    if test_email in r0.json()[activity]["participants"]:
        # remove if leftover from previous run
        client.delete(f"/activities/{activity}/participants?email={test_email}")

    # Sign up the test email
    r1 = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert r1.status_code == 200
    assert test_email in r1.json().get("message", "")

    # Verify participant added
    r2 = client.get("/activities")
    assert r2.status_code == 200
    assert test_email in r2.json()[activity]["participants"]

    # Unregister the test email
    r3 = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert r3.status_code == 200

    # Verify removal
    r4 = client.get("/activities")
    assert r4.status_code == 200
    assert test_email not in r4.json()[activity]["participants"]
