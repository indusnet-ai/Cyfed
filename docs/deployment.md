# Deployment Guide

This guide describes how to deploy the central Flower Server Coordinator, the Next.js Dashboard API, and remote client nodes in a secure enterprise environment.

---

## 1. Network & Port Configurations

Enterprise firewalls must allow outbound and inbound traffic as follows:

| Component | Port | Protocol | Traffic Flow | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Flower Server Coordinator** | `8080` | gRPC | Inbound | Client nodes uploading/downloading parameter updates |
| **Next.js Dashboard API** | `3000` | HTTPS (REST) | Inbound | Heartbeats and metrics telemetry collection |
| **Supabase DB** | `5432` | TCP (PostgreSQL) | Outbound | Dashboard API database sync |

---

## 2. Server Deployment (Docker Setup)

### Dockerfile for Flower Server
Create a `Dockerfile` inside `services/flower-server/`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY python/fedcore /app/python/fedcore
COPY python/fedsoc /app/python/fedsoc
COPY services/flower-server /app/services/flower-server

RUN uv pip install --system -e /app/python/fedcore -e /app/python/fedsoc

EXPOSE 8080

ENTRYPOINT ["python", "services/flower-server/server.py"]
CMD ["--rounds", "3", "--min-clients", "4"]
```

Build and run:
```bash
docker build -t flower-server -f services/flower-server/Dockerfile .
docker run -p 8080:8080 -e SUPABASE_URL=... -e SUPABASE_KEY=... flower-server
```

---

## 3. Client Node Deployment (On-Premises)

Client nodes run inside local firewalls. The recommended deployment uses systemd services.

### Systemd Service Configuration
Create `/etc/systemd/system/fedsoc-client.service`:

```ini
[Unit]
Description=FedSOC Client Node Service
After=network.target

[Service]
Type=simple
User=fedsoc
WorkingDirectory=/opt/fedsoc
Environment=PATH=/opt/fedsoc/.venv/bin:/usr/local/bin:/usr/bin
ExecStart=/opt/fedsoc/.venv/bin/python services/local-node/client.py --profile bank --server-address coordinator.enterprise.com:8080 --dashboard-api https://dashboard.enterprise.com
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable fedsoc-client.service
sudo systemctl start fedsoc-client.service
```

---

## 4. Security Hardening

1.  **gRPC TLS Encryption**:
    - Pass `--root-certificates` and secure private key paths to enable TLS in gRPC communication.
2.  **IP Access Whitelisting**:
    - Restrict access to port `8080` (gRPC) to only registered client IP addresses.
3.  **Audit Logs**:
    - Ensure all client logs are routed to a local SIEM (Security Information and Event Management) for monitoring of database updates or audit issues.
