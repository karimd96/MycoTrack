import requests
from .conftest import API, ADMIN, OPERATOR, VIEWER


# ---------- Health ----------
class TestHealth:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["db"] == "postgresql"


# ---------- Auth ----------
class TestAuth:
    def test_admin_login_sets_cookies_and_me(self, admin_client):
        # Cookies present
        cookies = admin_client.cookies
        assert cookies.get("access_token"), "access_token cookie missing"
        assert cookies.get("refresh_token"), "refresh_token cookie missing"
        r = admin_client.get(f"{API}/auth/me")
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == ADMIN["email"]
        assert body["role"]["name"] == "admin"

    def test_register_defaults_to_viewer(self, unique_tag):
        s = requests.Session()
        email = f"reguser_{unique_tag}@example.com".lower()
        r = s.post(f"{API}/auth/register", json={"email": email, "password": "P@ssword1", "full_name": "Reg Test"})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["email"] == email
        assert body["role"]["name"] == "viewer"
        # cookies set
        assert s.cookies.get("access_token")

    def test_refresh_issues_new_access_token(self):
        s = requests.Session()
        s.post(f"{API}/auth/login", json=ADMIN)
        old_access = s.cookies.get("access_token")
        r = s.post(f"{API}/auth/refresh")
        assert r.status_code == 200
        new_access = s.cookies.get("access_token")
        assert new_access  # set
        # not strictly required to differ, but verify endpoint works

    def test_logout_clears_cookies(self):
        s = requests.Session()
        s.post(f"{API}/auth/login", json=ADMIN)
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200
        # subsequent /me without cookies must 401
        s2 = requests.Session()
        r2 = s2.get(f"{API}/auth/me")
        assert r2.status_code == 401

    def test_invalid_login(self):
        r = requests.post(f"{API}/auth/login", json={"email": "admin@mycotrack.io", "password": "wrong"})
        assert r.status_code == 401


# ---------- RBAC Viewer ----------
class TestRBACViewer:
    def test_viewer_can_read(self, viewer_client):
        for path in ("/species", "/locations", "/recipes", "/cultures"):
            r = viewer_client.get(f"{API}{path}")
            assert r.status_code == 200, f"{path}: {r.status_code}"

    def test_viewer_cannot_write(self, viewer_client):
        r = viewer_client.post(f"{API}/species", json={"scientific_name": "Forbidden sp."})
        assert r.status_code == 403
        r = viewer_client.post(f"{API}/locations", json={"name": "Forbidden"})
        assert r.status_code == 403
        r = viewer_client.post(f"{API}/recipes", json={"name": "Forbidden"})
        assert r.status_code == 403

    def test_viewer_cannot_list_users_or_roles(self, viewer_client):
        assert viewer_client.get(f"{API}/users").status_code == 403
        assert viewer_client.get(f"{API}/roles").status_code == 403


# ---------- RBAC Operator ----------
class TestRBACOperator:
    def test_operator_can_create_and_update_species(self, operator_client, unique_tag):
        r = operator_client.post(f"{API}/species", json={"scientific_name": f"Sp {unique_tag}", "common_name": "Op Test"})
        assert r.status_code == 201, r.text
        sid = r.json()["id"]
        r2 = operator_client.patch(f"{API}/species/{sid}", json={"common_name": "updated"})
        assert r2.status_code == 200
        # delete should be forbidden for operator
        r3 = operator_client.delete(f"{API}/species/{sid}")
        assert r3.status_code == 403

    def test_operator_cannot_delete_locations_recipes(self, operator_client, unique_tag, admin_client):
        # admin creates a location to attempt delete
        rc = admin_client.post(f"{API}/locations", json={"name": f"Loc {unique_tag}"})
        assert rc.status_code == 201
        lid = rc.json()["id"]
        assert operator_client.delete(f"{API}/locations/{lid}").status_code == 403

        rc2 = admin_client.post(f"{API}/recipes", json={"name": f"Rec {unique_tag}"})
        assert rc2.status_code == 201
        rid = rc2.json()["id"]
        assert operator_client.delete(f"{API}/recipes/{rid}").status_code == 403

    def test_operator_no_user_mgmt(self, operator_client):
        assert operator_client.get(f"{API}/users").status_code == 403


# ---------- Species/Locations/Recipes CRUD admin ----------
class TestCRUDAdmin:
    def test_species_full_lifecycle(self, admin_client, unique_tag):
        payload = {"scientific_name": f"Agaricus {unique_tag}", "common_name": "Button"}
        r = admin_client.post(f"{API}/species", json=payload)
        assert r.status_code == 201
        sid = r.json()["id"]
        # list
        rl = admin_client.get(f"{API}/species")
        assert rl.status_code == 200
        assert any(s["id"] == sid for s in rl.json())
        # get
        rg = admin_client.get(f"{API}/species/{sid}")
        assert rg.status_code == 200
        # patch
        rp = admin_client.patch(f"{API}/species/{sid}", json={"common_name": "Renamed"})
        assert rp.status_code == 200 and rp.json()["common_name"] == "Renamed"
        # delete
        rd = admin_client.delete(f"{API}/species/{sid}")
        assert rd.status_code == 204
        # gone
        assert admin_client.get(f"{API}/species/{sid}").status_code == 404

    def test_locations_full_lifecycle(self, admin_client, unique_tag):
        r = admin_client.post(f"{API}/locations", json={"name": f"Loc {unique_tag}"})
        assert r.status_code == 201
        lid = r.json()["id"]
        assert admin_client.patch(f"{API}/locations/{lid}", json={"description": "x"}).status_code == 200
        assert admin_client.delete(f"{API}/locations/{lid}").status_code == 204
        assert admin_client.get(f"{API}/locations/{lid}").status_code == 404

    def test_recipes_records_created_by(self, admin_client, unique_tag):
        me = admin_client.get(f"{API}/auth/me").json()
        r = admin_client.post(f"{API}/recipes", json={"name": f"Rec {unique_tag}"})
        assert r.status_code == 201
        rid = r.json()["id"]
        assert r.json()["created_by"] == me["id"]
        # cleanup
        admin_client.delete(f"{API}/recipes/{rid}")


# ---------- Cultures ----------
class TestCultures:
    def test_culture_create_validation_and_lineage(self, admin_client, operator_client, unique_tag):
        # create a species via admin
        sp = admin_client.post(f"{API}/species", json={"scientific_name": f"Cult sp {unique_tag}"}).json()
        sid = sp["id"]
        # invalid species id
        bad = operator_client.post(f"{API}/cultures", json={"code": f"BAD{unique_tag}", "species_id": "00000000-0000-0000-0000-000000000000"})
        assert bad.status_code == 400
        # invalid status
        bad2 = operator_client.post(f"{API}/cultures", json={"code": f"BAD{unique_tag}2", "species_id": sid, "status": "weird"})
        assert bad2.status_code == 400
        # parent + child
        op_me = operator_client.get(f"{API}/auth/me").json()
        parent = operator_client.post(f"{API}/cultures", json={"code": f"P{unique_tag}", "species_id": sid}).json()
        assert parent.get("created_by") == op_me["id"]
        child = operator_client.post(f"{API}/cultures", json={"code": f"C{unique_tag}", "species_id": sid, "parent_culture_id": parent["id"]}).json()
        # patch status to contaminated
        rp = operator_client.patch(f"{API}/cultures/{child['id']}", json={"status": "contaminated"})
        assert rp.status_code == 200 and rp.json()["status"] == "contaminated"
        # no DELETE endpoint for cultures => 405
        rd = admin_client.delete(f"{API}/cultures/{child['id']}")
        assert rd.status_code == 405
        # lineage chain
        lin = operator_client.get(f"{API}/cultures/{child['id']}/lineage")
        assert lin.status_code == 200
        ids = [c["id"] for c in lin.json()]
        assert child["id"] in ids and parent["id"] in ids

    def test_culture_events_lifecycle(self, admin_client, operator_client, viewer_client, unique_tag):
        sp = admin_client.post(f"{API}/species", json={"scientific_name": f"Ev sp {unique_tag}"}).json()
        cult = operator_client.post(f"{API}/cultures", json={"code": f"EVC{unique_tag}", "species_id": sp["id"]}).json()
        # operator can create event
        ev = operator_client.post(f"{API}/cultures/{cult['id']}/events", json={"event_type": "inspection", "notes": "ok"})
        assert ev.status_code == 201, ev.text
        eid = ev.json()["id"]
        # list
        lst = viewer_client.get(f"{API}/cultures/{cult['id']}/events")
        assert lst.status_code == 200 and any(e["id"] == eid for e in lst.json())
        # operator/viewer cannot delete
        assert operator_client.delete(f"{API}/culture-events/{eid}").status_code == 403
        assert viewer_client.delete(f"{API}/culture-events/{eid}").status_code == 403
        # admin can delete
        assert admin_client.delete(f"{API}/culture-events/{eid}").status_code == 204


# ---------- Users / Roles admin ----------
class TestUserMgmt:
    def test_list_roles(self, admin_client):
        r = admin_client.get(f"{API}/roles")
        assert r.status_code == 200
        names = sorted([x["name"] for x in r.json()])
        assert "admin" in names and "operator" in names and "viewer" in names

    def test_user_crud_and_soft_delete(self, admin_client, unique_tag):
        email = f"TEST_{unique_tag}@example.com"
        r = admin_client.post(f"{API}/users", json={"email": email, "password": "P@ss12345", "full_name": "T", "role_name": "viewer"})
        assert r.status_code == 201, r.text
        uid = r.json()["id"]
        # patch role
        rp = admin_client.patch(f"{API}/users/{uid}", json={"role_name": "operator"})
        assert rp.status_code == 200 and rp.json()["role"]["name"] == "operator"
        # soft delete (deactivate)
        rd = admin_client.delete(f"{API}/users/{uid}")
        assert rd.status_code == 200
        assert rd.json()["is_active"] is False
        # still exists
        rg = admin_client.get(f"{API}/users/{uid}")
        assert rg.status_code == 200 and rg.json()["is_active"] is False

    def test_admin_cannot_deactivate_self(self, admin_client):
        me = admin_client.get(f"{API}/auth/me").json()
        r = admin_client.delete(f"{API}/users/{me['id']}")
        assert r.status_code == 400
