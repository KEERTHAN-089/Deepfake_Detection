# Backend image for Google Cloud Run (CPU). deploy_cloud_run.py builds it with the model included.
FROM python:3.11-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# yt-dlp needs a JavaScript runtime to solve YouTube's player challenges.
COPY --from=denoland/deno:bin /deno /usr/local/bin/deno

RUN useradd -m -u 1000 user
WORKDIR /app

COPY requirements.txt .
# CPU-only PyTorch wheels keep the image far smaller than the default CUDA build.
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

COPY --chown=user . .

USER user
ENV HOME=/home/user \
    MODEL_DIR=/app/model \
    TEMP_DIR=/tmp/deepscan \
    PYTHONUNBUFFERED=1 \
    PORT=8080

EXPOSE 8080
# Cloud Run sets PORT; default to 8080 elsewhere.
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
