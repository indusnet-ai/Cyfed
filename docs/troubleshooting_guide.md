# Troubleshooting Guide: Common Fixes

This guide lists resolution steps for common startup errors and connectivity warnings on the FedSOC AI platform.

---

## 1. Local Ollama Server Unreachable

- **Symptom**: The AI SOC Analyst details display warnings or fall back to naive generators because the Llama 3.1 LLM is unreachable.
- **Cause**: The Ollama service is not listening on network addresses, or port `11434` is firewalled.
- **Resolution**:
  - Run Ollama locally and specify bind variables:
    ```bash
    # Windows PowerShell
    $env:OLLAMA_HOST="0.0.0.0"
    ollama serve
    ```
  - Verify accessibility by fetching local endpoints:
    ```bash
    curl http://localhost:11434/api/tags
    ```

---

## 2. PostgreSQL Connection Failures

- **Symptom**: Next.js API endpoints display `500 Connection Refused` when querying nodes or logging audit trails.
- **Cause**: The Postgres container is not booted or the connection string in `.env` is incorrect.
- **Resolution**:
  - Check container health status:
    ```bash
    docker ps -a --filter name=fedsoc-db
    ```
  - Inspect logs:
    ```bash
    docker-compose logs db
    ```

---

## 3. Flower Server Port Collisions

- **Symptom**: The SuperLink server fails to start, displaying `Port 8080 already in use`.
- **Cause**: Another service (like an alternate web server or proxy) is listening on port `8080`.
- **Resolution**:
  - Locate the pid blocking the port:
    ```powershell
    netstat -ano | findstr :8080
    ```
  - Kill the process or edit the port map inside [docker-compose.yml](file:///e:/CyberFed%20AI/docker-compose.yml).
