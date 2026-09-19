"""
Deploys the backend image to Azure Container Apps (works with Azure for Students).

The image is built by GitHub Actions (.github/workflows/backend-image.yml) and published
to GitHub Container Registry, because Azure for Students does not allow cloud builds.

Prerequisites (once): Azure CLI installed, then `az login`; the ghcr.io package is public.

Usage (from Deepfake/python-backend):
    python deploy_azure.py [image]      # default: ghcr.io/keerthan-089/deepscan-api:latest

The Firebase service-account key is stored as an encrypted Container Apps secret. It is
written only to a temporary spec file that is deleted afterwards, never printed or passed
on the command line.
"""
import json
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

LOCATION = "uaenorth"  # allowed by the Azure for Students policy and supports Container Apps
RESOURCE_GROUP = "deepscan-rg"
ENVIRONMENT = "deepscan-env"
APP = "deepscan-api"
IMAGE = sys.argv[1] if len(sys.argv) > 1 else "ghcr.io/keerthan-089/deepscan-api:latest"
FIREBASE_PROJECT = "deepfake-auth-e79a8-b4ffa"
BASE_DIR = Path(__file__).parent
ALLOWED_ORIGINS = ",".join(
    [
        f"https://{FIREBASE_PROJECT}.web.app",
        f"https://{FIREBASE_PROJECT}.firebaseapp.com",
        "http://localhost:3000",
    ]
)

AZ = shutil.which("az") or r"C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"


def az(*args, capture=False):
    print("> az", " ".join(args))
    result = subprocess.run([AZ, *args, "--only-show-errors"], text=True, capture_output=capture)
    if result.returncode != 0:
        if capture:
            print(result.stdout, result.stderr, sep="\n")
        sys.exit(f"az {' '.join(args[:2])} failed")
    return result.stdout.strip() if capture else None


def exists(*args):
    """True when an `az ... show` command finds the resource."""
    return subprocess.run([AZ, *args, "-o", "none"], capture_output=True).returncode == 0


def main():
    if not Path(AZ).exists():
        sys.exit("Azure CLI not found. Install it and run `az login`.")
    sa_path = BASE_DIR / "firebase_service_account.json"
    if not sa_path.exists():
        sys.exit("Missing firebase_service_account.json; sign-in and history need it.")

    az("extension", "add", "--name", "containerapp", "--upgrade", "--yes")
    for namespace in ("Microsoft.App", "Microsoft.OperationalInsights"):
        az("provider", "register", "--namespace", namespace, "--wait")
    az("group", "create", "-n", RESOURCE_GROUP, "-l", LOCATION, "-o", "none")

    if not exists("containerapp", "env", "show", "-n", ENVIRONMENT, "-g", RESOURCE_GROUP):
        az("containerapp", "env", "create", "-n", ENVIRONMENT, "-g", RESOURCE_GROUP, "-l", LOCATION,
           "--logs-destination", "none", "-o", "none")
    env_id = az("containerapp", "env", "show", "-n", ENVIRONMENT, "-g", RESOURCE_GROUP,
                "--query", "id", "-o", "tsv", capture=True)

    spec = {
        "location": LOCATION,
        "name": APP,
        "properties": {
            "managedEnvironmentId": env_id,
            "configuration": {
                "ingress": {"external": True, "targetPort": 8080, "transport": "auto", "allowInsecure": False},
                "secrets": [{"name": "firebase-sa", "value": sa_path.read_text(encoding="utf-8")}],
            },
            "template": {
                "containers": [
                    {
                        "name": "api",
                        "image": IMAGE,
                        "resources": {"cpu": 2.0, "memory": "4Gi"},
                        "env": [
                            {"name": "ALLOWED_ORIGINS", "value": ALLOWED_ORIGINS},
                            {"name": "MAX_UPLOAD_MB", "value": "200"},
                            {"name": "FIREBASE_SERVICE_ACCOUNT_JSON", "secretRef": "firebase-sa"},
                            # Changes on every deploy so a new revision pulls the latest image.
                            {"name": "DEPLOYED_AT", "value": time.strftime("%Y-%m-%dT%H:%M:%S")},
                        ],
                        "probes": [
                            {
                                "type": "Startup",
                                "httpGet": {"path": "/health", "port": 8080},
                                "initialDelaySeconds": 5,
                                "periodSeconds": 5,
                                "failureThreshold": 60,
                            }
                        ],
                    }
                ],
                "scale": {"minReplicas": 0, "maxReplicas": 2},
            },
        },
    }

    # JSON is valid YAML, and json.dumps escapes the key safely.
    with tempfile.TemporaryDirectory(prefix="deepscan-spec-") as tmp:
        spec_file = Path(tmp) / "app.yaml"
        spec_file.write_text(json.dumps(spec), encoding="utf-8")
        action = "update" if exists("containerapp", "show", "-n", APP, "-g", RESOURCE_GROUP) else "create"
        print(f"{action.title()} Container App {APP} with {IMAGE} …")
        az("containerapp", action, "-n", APP, "-g", RESOURCE_GROUP, "--yaml", str(spec_file), "-o", "none")

    fqdn = az("containerapp", "show", "-n", APP, "-g", RESOURCE_GROUP,
              "--query", "properties.configuration.ingress.fqdn", "-o", "tsv", capture=True)
    print()
    print(f"API URL: https://{fqdn}")


if __name__ == "__main__":
    main()
