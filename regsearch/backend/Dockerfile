FROM python:3.12-slim

# Keep Python lean and unbuffered for container logs.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # fastembed caches downloaded ONNX models here; mount a volume to persist.
    FASTEMBED_CACHE_PATH=/home/app/.cache/fastembed

WORKDIR /app

# Install dependencies first so this layer caches across code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Run as a non-root user.
RUN useradd --create-home --uid 1000 app
COPY --chown=app:app . .
USER app

EXPOSE 8000

# The embedding/reranker models download on first request (~130MB), then cache.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
