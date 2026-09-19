"""
Deploys this backend to Google Cloud Run in the Firebase project.

Prerequisites (once):
  - Google Cloud CLI installed, then `gcloud auth login`
  - The Firebase project on the Blaze (pay-as-you-go) plan

Usage (from Deepfake/python-backend):
    python deploy_cloud_run.py

Copies the API code, Dockerfile and trained model into a temporary build folder,
builds the image with Cloud Build and deploys it. The service signs in to Firebase
with its own Google identity, so no key file is uploaded.
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

PROJECT = "deepfake-auth-e79a8-b4ffa"
REGION = "us-central1"
SERVICE = "deepscan-api"
BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR.parent / "xception_lstm_20260129_074841"
ALLOWED_ORIGINS = ",".join(
    [
        f"https://{PROJECT}.web.app",
        f"https://{PROJECT}.firebaseapp.com",
        "http://localhost:3000",
    ]
)

GCLOUD = shutil.which("gcloud")


def gcloud(*args, capture=False):
    cmd = [GCLOUD, *args, f"--project={PROJECT}"]
    print("> gcloud", " ".join(args))
    result = subprocess.run(cmd, check=True, text=True, capture_output=capture)
    return result.stdout.strip() if capture else None


def main():
    if not GCLOUD:
        sys.exit("gcloud not found. Install the Google Cloud CLI and run `gcloud auth login`.")
    for required in (MODEL_DIR / "best_model.pth", MODEL_DIR / "results.json"):
        if not required.exists():
            sys.exit(f"Missing {required}")

    gcloud("services", "enable", "run.googleapis.com", "cloudbuild.googleapis.com", "artifactregistry.googleapis.com")

    # Let the service's default identity read and write Firestore (history).
    number = gcloud("projects", "describe", PROJECT, "--format=value(projectNumber)", capture=True)
    runtime_sa = f"{number}-compute@developer.gserviceaccount.com"
    gcloud(
        "projects", "add-iam-policy-binding", PROJECT,
        f"--member=serviceAccount:{runtime_sa}", "--role=roles/datastore.user",
        "--condition=None", "--quiet", "--format=none",
    )

    with tempfile.TemporaryDirectory(prefix="deepscan-build-") as tmp:
        build = Path(tmp)
        for name in ("main.py", "requirements.txt", "Dockerfile"):
            shutil.copy2(BASE_DIR / name, build / name)
        (build / "model").mkdir()
        for name in ("best_model.pth", "results.json"):
            shutil.copy2(MODEL_DIR / name, build / "model" / name)

        env_file = build / "env.yaml"
        env_file.write_text(
            f'ALLOWED_ORIGINS: "{ALLOWED_ORIGINS}"\n'
            f'FIREBASE_PROJECT_ID: "{PROJECT}"\n'
            'MAX_UPLOAD_MB: "200"\n',
            encoding="utf-8",
        )

        print("Building and deploying (the first build takes 10-15 minutes) …")
        gcloud(
            "run", "deploy", SERVICE,
            f"--source={build}",
            f"--region={REGION}",
            "--allow-unauthenticated",
            "--memory=4Gi",
            "--cpu=2",
            "--cpu-boost",
            "--timeout=900",
            "--concurrency=8",
            "--min-instances=0",
            "--max-instances=2",
            f"--env-vars-file={env_file}",
            "--quiet",
        )

    url = gcloud("run", "services", "describe", SERVICE, f"--region={REGION}", "--format=value(status.url)", capture=True)
    print()
    print(f"API URL: {url}")


if __name__ == "__main__":
    main()
