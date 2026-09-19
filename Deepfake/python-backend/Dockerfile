# Image for the Hugging Face Space (CPU). Built by HF from the files deploy_space.py uploads.
FROM python:3.11-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# yt-dlp needs a JavaScript runtime to solve YouTube's player challenges.
COPY --from=denoland/deno:bin /deno /usr/local/bin/deno

# Hugging Face runs Spaces as user 1000.
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
    PYTHONUNBUFFERED=1

EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
