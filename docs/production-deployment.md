# FixMyRoad — Production Deployment & Operations Guide

## Overview

This document outlines the production deployment strategy for the FixMyRoad AI-powered civic road damage reporting platform.

---

## 🐳 Production Deployment with Docker Compose

1. **Environment Setup**:
   Copy `.env.example` to `.env` and populate production credentials:
   ```bash
   cp .env.example .env
   ```

2. **Launch Container Services**:
   ```bash
   docker compose -f docker-compose.production.yml up -d --build
   ```

3. **Verify Container Health**:
   ```bash
   docker compose -f docker-compose.production.yml ps
   ```

---

## 🛡️ Production Security Checklist

- [x] Set `NODE_ENV=production`.
- [x] Configure strong, unique `JWT_SECRET` (minimum 64 characters).
- [x] Ensure `ENABLE_API_DOCS=false` to disable public Swagger documentation.
- [x] Verify Cloudinary HTTPS production credentials.
- [x] Enable SSL/TLS termination on Nginx reverse proxy.
- [x] Verify MongoDB authentication and persistent data volume mounts.
- [x] Verify Outbox notification processor polling interval (`10000ms`).
