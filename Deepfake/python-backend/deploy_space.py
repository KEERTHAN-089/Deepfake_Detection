"""
Deploys this backend to a Hugging Face Docker Space.

Usage (from Deepfake/python-backend, after `huggingface-cli login` with a write token):
    python deploy_space.py [space-name]

Uploads the API code, the Dockerfile and the trained model, then stores the Firebase
service-account key as a Space secret. The key is read from disk and never printed.
"""
import os
import sys
from pathlib import Path

from huggingface_hub import HfApi

BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR.parent / "xception_lstm_20260129_074841"
SPACE_NAME = sys.argv[1] if len(sys.argv) > 1 else "deepscan-api"
FIREBASE_PROJECT = "deepfake-auth-e79a8-b4ffa"
ALLOWED_ORIGINS = ",".join(
    [
        f"https://{FIREBASE_PROJECT}.web.app",
        f"https://{FIREBASE_PROJECT}.firebaseapp.com",
        "http://localhost:3000",
    ]
)


def find_service_account():
    candidates = [os.environ.get("FIREBASE_SERVICE_ACCOUNT"), BASE_DIR / "firebase_service_account.json"]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return Path(candidate)
    return None


def main():
    api = HfApi(token=os.environ.get("HF_TOKEN"))
    user = api.whoami()["name"]
    repo_id = f"{user}/{SPACE_NAME}"

    for required in (MODEL_DIR / "best_model.pth", MODEL_DIR / "results.json"):
        if not required.exists():
            sys.exit(f"Missing {required}")

    print(f"Creating or updating Space {repo_id} …")
    api.create_repo(repo_id, repo_type="space", space_sdk="docker", exist_ok=True)

    print("Uploading API code …")
    api.upload_folder(
        repo_id=repo_id,
        repo_type="space",
        folder_path=BASE_DIR,
        allow_patterns=["main.py", "requirements.txt", "Dockerfile"],
        commit_message="Update API code",
    )
    api.upload_file(
        repo_id=repo_id,
        repo_type="space",
        path_or_fileobj=str(BASE_DIR / "space_README.md"),
        path_in_repo="README.md",
        commit_message="Update Space README",
    )

    print("Uploading model (152 MB, this can take a few minutes) …")
    api.upload_folder(
        repo_id=repo_id,
        repo_type="space",
        folder_path=MODEL_DIR,
        path_in_repo="model",
        allow_patterns=["best_model.pth", "results.json"],
        commit_message="Update model",
    )

    sa_path = find_service_account()
    if sa_path:
        api.add_space_secret(repo_id, "FIREBASE_SERVICE_ACCOUNT_JSON", sa_path.read_text(encoding="utf-8"))
        print("Stored Firebase service account as a Space secret.")
    else:
        print("WARNING: no Firebase service account found; sign-in and history will be disabled.")
    api.add_space_variable(repo_id, "ALLOWED_ORIGINS", ALLOWED_ORIGINS)

    subdomain = repo_id.lower().replace("/", "-").replace("_", "-").replace(".", "-")
    print()
    print(f"Space page: https://huggingface.co/spaces/{repo_id}")
    print(f"API URL:    https://{subdomain}.hf.space")


if __name__ == "__main__":
    main()
