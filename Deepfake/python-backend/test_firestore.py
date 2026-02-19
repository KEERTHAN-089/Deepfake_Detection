import os
from pathlib import Path
from datetime import datetime


def main():
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except Exception as e:
        print("firebase_admin not installed:", e)
        return

    # Find service account
    sa_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    if sa_path and Path(sa_path).exists():
        cred = credentials.Certificate(sa_path)
    else:
        local = Path(__file__).parent / "firebase_service_account.json"
        if local.exists():
            cred = credentials.Certificate(str(local))
        else:
            cred = credentials.ApplicationDefault()

    try:
        firebase_admin.initialize_app(cred)
    except Exception as e:
        # ignore if already initialized
        print("firebase_admin init warning:", e)

    client = firestore.client()

    # Write test document
    try:
        doc_ref = client.collection("test_connect").document()
        data = {"checked_at": datetime.now().isoformat(), "ok": True}
        doc_ref.set(data)
        print("Wrote test doc id:", doc_ref.id)
    except Exception as e:
        print("Failed to write test doc:", e)
        return

    # Read back latest 5 entries
    try:
        docs = client.collection("test_connect").order_by("checked_at", direction=firestore.Query.DESCENDING).limit(5).stream()
        print("Recent test_connect documents:")
        for d in docs:
            print(d.id, d.to_dict())
    except Exception as e:
        print("Failed to read test docs:", e)


if __name__ == "__main__":
    main()
