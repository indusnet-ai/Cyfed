FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1

COPY packages/ai/pyproject.toml ./packages/ai/
COPY services/local-node/pyproject.toml ./services/local-node/

RUN uv sync --project services/local-node --no-install-project

COPY packages/ai ./packages/ai
COPY services/local-node ./services/local-node

RUN uv sync --project services/local-node

# Arguments will be overridden by docker-compose commands
CMD ["uv", "run", "--project", "services/local-node", "python", "-m", "client", "--server", "flower-server:8080", "--dashboard-api", "http://dashboard:3000"]
