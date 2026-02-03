from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200

def test_health():
    response = client.get("/health")
    assert response.status_code == 200

def test_analyze():
    response = client.post("/analyze", files={"file": ("test_video.mp4", b"fake video content")})
    assert response.status_code == 200

def test_result():
    response = client.get("/result/1")
    assert response.status_code == 200

def test_results():
    response = client.get("/results")
    assert response.status_code == 200

def test_analyze_error():
    response = client.post("/analyze")
    assert response.status_code == 400