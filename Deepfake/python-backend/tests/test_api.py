from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Deepfake Detection API"}

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_analyze():
    with open("temp/video_1769758206113.mp4", "rb") as file:
        response = client.post("/analyze", files={"file": file})
    assert response.status_code == 200
    assert "result" in response.json()

def test_result():
    response = client.get("/result/1")
    assert response.status_code == 200
    assert "result" in response.json()

def test_results():
    response = client.get("/results")
    assert response.status_code == 200
    assert isinstance(response.json(), list)