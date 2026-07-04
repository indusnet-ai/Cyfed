# Installation Guide: Pilot Onboarding

This document provides deployment guidelines and server requirements for hosting the FedSOC AI platform.

---

## 1. System Hardware Requirements

- **CPU**: 4 Cores minimum (8 Cores recommended for local LLM inference)
- **RAM**: 16 GB minimum (32 GB recommended to support local Llama 3.1 model running in RAM)
- **Disk Space**: 50 GB SSD storage
- **Operating System**: Linux (Ubuntu 20.04 LTS or newer) or Windows Server (with WSL2 enabled)

---

## 2. Onboarding Deployment Steps

### Step 1: Pre-installation dependencies
Verify that Docker and Docker Compose are installed:
```bash
docker --version
docker-compose --version
```

### Step 2: Configure Environment Variables
Create `.env` inside the project root:
```bash
FLOWER_SERVER_URL=http://superlink:8080
OLLAMA_URL=http://host.docker.internal:11434
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 3: Launch Docker containers
Run the compose setup in detached mode:
```bash
docker-compose up -d --build
```
This builds and starts PostgreSQL database, Flower server gRPC coordinator, Next.js frontend presentation client, and Nginx proxy in parallel.

### Step 4: Verify Deployment health
Point your browser to the local proxy:
- Homepage: `http://localhost/`
- API Health Status: `http://localhost/api/health`
- Readiness check: `http://localhost/api/ready`
