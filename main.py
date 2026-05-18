import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

# FastAPI tətbiqini başladırıq
app = FastAPI(title="Bearbee Cyber Empire - Production Backend")

# CORS Tənzimləmələri (GitHub Pages və Telegram Botun koda problemsiz qoşulması üçün)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔐 Supabase Verilənlər Bazası Parametrləri
SUPABASE_URL = "https://ykfrzkcfxkgvselmtewg.supabase.co/rest/v1/users"
SUPABASE_KEY = "EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZnJ6a2NmeGtndnNlbG10ZXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDMzMjEsImV4cCI6MjA5NDYxOTMyMX0.V66_ZbIE2OT_VSv9l6s4Ktnt4QliB_Ay5gIBSJ4Rwbw"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Yeni oyunçular üçün standart Bearbee şablonu
def get_default_user_template(user_id: str):
    return {
        "user_id": str(user_id),
        "honey": 0,
        "level": 1,
        "energy": 100,
        "ton_balance": 0.00,
        "reklam_baxis": 0
    }

# --- API ENDPOINT-LƏRİ ---

# 1. 📥 Oyunçu məlumatlarını bazadan oxumaq (İstifadəçi yoxdursa avtomatik qeydiyyat edir)
@app.get("/api/user/{user_id}")
async def get_or_create_user(user_id: str):
    try:
        query_url = f"{SUPABASE_URL}?user_id=eq.{user_id}"
        response = requests.get(query_url, headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                return data[0]
            
            # Əgər istifadəçi bazada tapılmadısa, yenisini yaradırıq
            new_user_data = get_default_user_template(user_id)
            insert_response = requests.post(SUPABASE_URL, headers=HEADERS, json=new_user_data)
            if insert_response.status_code in [200, 201]:
                inserted_json = insert_response.json()
                return inserted_json[0] if inserted_json else new_user_data
        
        return get_default_user_template(user_id)
    except Exception:
        return get_default_user_template(user_id)

# 2. 📤 Oyundakı klikləri, reklam baxışlarını və balans yeniləmələrini sinxronizasiya etmək
@app.post("/api/user/sync")
async def sync_user_data(data: Dict[Any, Any]):
    try:
        user_id = data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id mütləq göndərilməlidir.")
        
        # Gələn boş olmayan dataları süzgəcdən keçiririk
        update_fields = {k: v for k, v in data.items() if v is not None and k != "user_id"}
        
        if not update_fields:
            return {"status": "no_changes"}

        update_url = f"{SUPABASE_URL}?user_id=eq.{user_id}"
        response = requests.patch(update_url, headers=HEADERS, json=update_fields)
        
        if response.status_code in [200, 201, 204]:
            return {"status": "success", "synced_fields": list(update_fields.keys())}
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Serverin başladılması hissəsi (Render və digər Cloud serverləri üçün xüsusi optimallaşdırılıb)
if __name__ == "__main__":
    import uvicorn
    # Render serverinin təyin etdiyi dinamik portu oxuyur, tapmasa lokal rejimdə 8000-də işləyir
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

