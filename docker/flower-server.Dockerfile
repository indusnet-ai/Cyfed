FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1
# Copy only pyproject.toml first to cache dependency builds
COPY packages/ai/pyproject.toml ./packages/ai/
COPY services/flower-server/pyproject.toml ./services/flower-server/

# Install the server dependencies (using local workspace source path redirects)
RUN uv sync --project services/flower-server --no-install-project

# Copy source code
COPY packages/ai ./packages/ai
COPY services/flower-server ./services/flower-server

# Sync project
RUN uv sync --project services/flower-server

EXPOSE 8080

CMD ["uv", "run", "--project", "services/flower-server", "python", "-m", "server", "--host", "0.0.0.0", "--port", "8080"]
