import os
import httpx
import json
from dotenv import load_dotenv

# Muat variabel environment dari file .env
load_dotenv()

TENANT_URL = os.getenv("UIPATH_TENANT_URL")
CLIENT_ID = os.getenv("UIPATH_CLIENT_ID")
CLIENT_SECRET = os.getenv("UIPATH_CLIENT_SECRET")
BASE_URL = "https://staging.uipath.com/hackathon26_123/DefaultTenant"

def get_access_token() -> str:
    """Mengambil Access Token dari UiPath Identity Server"""
    response = httpx.post(
        "https://staging.uipath.com/hackathon26_123/identity_/connect/token",
        data={
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "scope": "OR.Execution OR.Execution.Read OR.Execution.Write OR.Folders OR.Folders.Read OR.Folders.Write OR.Jobs OR.Jobs.Read OR.Jobs.Write OR.Monitoring OR.Monitoring.Read OR.Monitoring.Write OR.Tasks OR.Tasks.Read"
        }
    )
    print("Token response:", response.status_code, response.json().get("scope"))
    response.raise_for_status()
    return response.json()["access_token"]

def get_headers() -> dict:
    """Membuat header dasar untuk setiap request API"""
    token = get_access_token()
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-UIPATH-TenantName": "DefaultTenant"
        # X-UIPATH-OrganizationUnitId yang kosong dihapus dari sini agar tidak error
    }

def test_connection() -> dict:
    """Mengetes koneksi dan mengambil daftar Folder"""
    headers = get_headers()
    response = httpx.get(
        f"{BASE_URL}/orchestrator_/odata/Folders",
        headers=headers
    )
    folders = response.json().get("value", [])
    print("Folders:", [(f["DisplayName"], f["Id"]) for f in folders])
    return {
        "connected": True,
        "folders": [{"name": f["DisplayName"], "id": f["Id"]} for f in folders]
    }

def get_processes() -> dict:
    """Mengambil daftar proses (Releases) yang ada di Orchestrator"""
    headers = get_headers()
    # Memasukkan Folder ID yang spesifik
    headers["X-UIPATH-OrganizationUnitId"] = "3019323"
    
    response = httpx.get(
        f"{BASE_URL}/orchestrator_/odata/Releases",
        headers=headers,
        params={"$top": 10}
    )
    print("Releases:", response.status_code, response.text[:500])
    releases = response.json().get("value", [])
    return {
        "processes": [
            {
                "name": r["Name"],
                "key": r["Key"],
                "process_key": r.get("ProcessKey", "")
            } for r in releases
        ]
    }

def trigger_process(release_key: str, input_arguments: dict = {}) -> dict:
    """Menjalankan (Trigger) Job/Proses di UiPath Orchestrator"""
    headers = get_headers()
    
    # PERBAIKAN: Menggunakan X-UIPATH-OrganizationUnitId (sebelumnya salah ketik X-UIPATH-FolderId)
    headers["X-UIPATH-OrganizationUnitId"] = os.getenv("UIPATH_FOLDER_ID", "3019323")
    
    payload = {
        "startInfo": {
            "ReleaseKey": release_key,
            "Strategy": "JobsCount",  # PERBAIKAN 1: Ubah dari "All" menjadi "JobsCount"
            "JobsCount": 1,
            "InputArguments": json.dumps(input_arguments)  # PERBAIKAN 2: Gunakan json.dumps agar format JSON-nya valid (kutip ganda)
        }
    }
    
    response = httpx.post(
        f"{BASE_URL}/orchestrator_/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs",
        headers=headers,
        json=payload
    )
    
    print("Trigger response:", response.status_code, response.text[:300])
    return {"status": response.status_code, "data": response.json()}