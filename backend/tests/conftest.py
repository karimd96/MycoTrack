import os
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://mycotrack-postgres.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@mycotrack.io", "password": "MycoAdmin#2026"}
OPERATOR = {"email": "operator@mycotrack.io", "password": "Operator#2026"}
VIEWER = {"email": "viewer@mycotrack.io", "password": "Viewer#2026"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed for {creds['email']}: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="session")
def admin_client():
    return _login(ADMIN)


@pytest.fixture(scope="session")
def operator_client():
    return _login(OPERATOR)


@pytest.fixture(scope="session")
def viewer_client():
    return _login(VIEWER)


@pytest.fixture(scope="session")
def api_url():
    return API


@pytest.fixture(scope="session")
def unique_tag():
    return f"TEST_{uuid.uuid4().hex[:8]}"
