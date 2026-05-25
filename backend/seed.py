import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Hapus data lama
supabase.table("incidents").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

seed_data = [
    # LOW risk — aman
    {
        "vendor_name": "PT Graha Konstruksi Nusantara",
        "amount": 85000000,
        "risk_score": 0,
        "status": "auto_approved",
        "operator_note": ""
    },
    {
        "vendor_name": "CV Teknindo Mitra Sejati",
        "amount": 120000000,
        "risk_score": 0,
        "status": "auto_approved",
        "operator_note": ""
    },
    # MEDIUM risk
    {
        "vendor_name": "PT Anugerah Logistik Prima",
        "amount": 550000000,
        "risk_score": 30,
        "status": "auto_approved",
        "operator_note": ""
    },
    {
        "vendor_name": "CV Mitra Bangun Persada",
        "amount": 670000000,
        "risk_score": 30,
        "status": "auto_approved",
        "operator_note": ""
    },
    # HIGH risk — sudah di-review
    {
        "vendor_name": "PT Surya Mandiri Abadi",
        "amount": 1200000000,
        "risk_score": 50,
        "status": "approved",
        "operator_note": "Sudah diverifikasi oleh procurement officer"
    },
    {
        "vendor_name": "PT Delta Karya Utama",
        "amount": 980000000,
        "risk_score": 50,
        "status": "rejected",
        "operator_note": "Vendor tidak terdaftar di sistem e-katalog"
    },
    # CRITICAL — pending review (buat demo human override)
    {
        "vendor_name": "PT Gelap Gulita Sentosa",
        "amount": 2500000000,
        "risk_score": 100,
        "status": "pending_review",
        "operator_note": ""
    },
    {
        "vendor_name": "CV Anonim Jaya Abadi",
        "amount": 1800000000,
        "risk_score": 90,
        "status": "pending_review",
        "operator_note": ""
    },
]

result = supabase.table("incidents").insert(seed_data).execute()
print(f"Seeded {len(result.data)} incidents")