# Production Deployment Guide

This guide covers deploying the Student Learning Companion to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
3. [Docker-based Deployment](#docker-based-deployment)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Running the Application](#running-the-application)
7. [Health Checks](#health-checks)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

## Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- PostgreSQL 14+ (managed service or self-hosted)
- Anthropic API key
- Domain name (for production)
- SSL/TLS certificate (for HTTPS)

## Deployment Options

### Option 1: Docker Compose (Recommended for MVP)

Best for small deployments and single-server setups.

**Pros:**
- Simple setup
- All services in one place
- Easy to manage

**Cons:**
- Limited scalability
- Single point of failure
- Manual backup management

### Option 2: Kubernetes

Best for production with high availability requirements.

**Pros:**
- Auto-scaling
- Self-healing
- Load balancing
- Rolling updates

**Cons:**
- Complex setup
- Requires operational expertise

### Option 3: Platform-as-a-Service (Heroku, Render, Railway)

Best for quick deployment with minimal ops burden.

**Pros:**
- Zero infrastructure management
- Automatic scaling
- Built-in monitoring

**Cons:**
- Higher cost
- Less control
- Vendor lock-in

---

## Docker-based Deployment

### Step 1: Build Docker Images

```bash
# From project root
docker-compose -f docker-compose.prod.yml build

# Or build individual images
docker build -f packages/backend/Dockerfile -t student-companion-backend:latest .
docker build -f packages/frontend/Dockerfile -t student-companion-frontend:latest .
```

### Step 2: Verify Images

```bash
docker images | grep student-companion
```

Expected output:
```
student-companion-frontend    latest    abc123...    2 days ago    50MB
student-companion-backend     latest    def456...    2 days ago    200MB
```

### Step 3: Test Locally

```bash
# Create .env file with test values
cat > .env <<EOF
DB_USER=postgres
DB_PASSWORD=testpass
DB_NAME=student_companion
ANTHROPIC_API_KEY=sk-ant-test
JWT_SECRET=test-secret
FRONTEND_URL=http://localhost:3000
EOF

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Step 4: Run Database Migrations

```bash
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate deploy

# Seed initial data (optional)
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma db seed
```

### Step 5: Verify Services

```bash
# Backend health check
curl http://localhost:5000/health

# Frontend (should return HTML)
curl http://localhost:3000
```

---

## Database Setup

### Option 1: Docker Postgres (Included)

Already configured in `docker-compose.prod.yml`.

### Option 2: Managed Database Service

#### AWS RDS

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier student-companion \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password STRONG_PASSWORD \
  --allocated-storage 20 \
  --publicly-accessible false

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier student-companion \
  --query 'DBInstances[0].Endpoint.Address'
```

Update `DATABASE_URL`:
```
DATABASE_URL=postgresql://postgres:PASSWORD@student-companion.xxxxx.us-east-1.rds.amazonaws.com:5432/student_companion
```

#### Azure Database for PostgreSQL

```bash
# Create via Azure CLI
az postgres server create \
  --name student-companion-db \
  --resource-group my-resource-group \
  --location eastus \
  --admin-user postgres \
  --admin-password STRONG_PASSWORD \
  --sku-name B_Gen5_1
```

#### DigitalOcean Managed Postgres

```bash
# Create via doctl
doctl databases create \
  --engine pg \
  --region nyc3 \
  --size db-s-1vcpu-1gb \
  student-companion
```

### Initial Schema Setup

```bash
# Apply all migrations
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate deploy

# Seed with sample data
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma db seed

# Verify schema
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d student_companion -c "\dt"
```

### Backup Strategy

```bash
# Daily backup (add to crontab)
0 2 * * * docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres student_companion | \
  gzip > /backups/student_companion_$(date +\%Y\%m\%d).sql.gz

# Restore from backup
gunzip < /backups/student_companion_20240117.sql.gz | \
  psql -U postgres -d student_companion
```

---

## Environment Configuration

### 1. Create Production .env File

```bash
cp packages/backend/.env.production.example packages/backend/.env
```

Edit with production values:

```bash
# Database
DATABASE_URL=postgresql://user:pass@db.example.com/student_companion

# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxx
SENDGRID_API_KEY=SG.xxxx

# Security
JWT_SECRET=$(openssl rand -base64 32)

# URLs
FRONTEND_URL=https://app.example.com

# Keep everything else from .env.production.example
```

### 2. Secure Secret Management

**Option A: GitHub Secrets** (for CI/CD)

```bash
# In GitHub repo Settings > Secrets and variables > Actions
ANTHROPIC_API_KEY: sk-ant-...
DATABASE_URL: postgresql://...
JWT_SECRET: ...
```

**Option B: Environment Variables on Server**

```bash
# SSH into server
export ANTHROPIC_API_KEY=sk-ant-...
export DATABASE_URL=postgresql://...
export JWT_SECRET=...

# Or use a secrets file (not in version control)
set -a
source /etc/student-companion/.env.prod
set +a
```

**Option C: Secrets Management Service**

- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault

---

## Running the Application

### Option 1: Docker Compose

```bash
# Create directory structure
mkdir -p /opt/student-companion/{data,backups}
cd /opt/student-companion

# Copy files
cp /path/to/docker-compose.prod.yml .
cp /path/to/.env packages/backend/

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Cleanup (CAUTION: deletes volumes)
docker-compose -f docker-compose.prod.yml down -v
```

### Option 2: Manual Docker Containers

```bash
# Start PostgreSQL
docker run -d --name student-companion-db \
  -e POSTGRES_PASSWORD=secure_password \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine

# Start Backend
docker run -d --name student-companion-backend \
  -p 5000:5000 \
  --link student-companion-db:postgres \
  -e DATABASE_URL=postgresql://postgres:password@postgres:5432/student_companion \
  student-companion-backend:latest

# Start Frontend
docker run -d --name student-companion-frontend \
  -p 3000:3000 \
  student-companion-frontend:latest
```

### Option 3: Systemd Service

Create `/etc/systemd/system/student-companion.service`:

```ini
[Unit]
Description=Student Learning Companion
Requires=docker.service
After=docker.service network.target
Wants=student-companion.timer

[Service]
Type=simple
Restart=unless-stopped
RestartSec=10
WorkingDirectory=/opt/student-companion
EnvironmentFile=/opt/student-companion/.env
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
User=docker

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable student-companion
sudo systemctl start student-companion
sudo systemctl status student-companion
```

---

## Health Checks

### Backend Health

```bash
# Check if backend is responding
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-17T12:34:56.789Z"}
```

### Frontend Health

```bash
# Check if frontend is serving
curl -I http://localhost:3000

# Expected response:
# HTTP/1.1 200 OK
```

### Database Health

```bash
# Connect to database
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d student_companion -c "SELECT 1;"

# Expected response:
# ?column?
# ----------
#        1
```

### Docker Service Health

```bash
docker-compose -f docker-compose.prod.yml ps

# Check for healthy status:
# NAME                  STATUS
# postgres              Up 2 hours (healthy)
# backend               Up 2 hours (healthy)
# frontend              Up 2 hours (healthy)
```

---

## Monitoring

### Log Monitoring

```bash
# View all service logs
docker-compose -f docker-compose.prod.yml logs

# Follow backend logs
docker-compose -f docker-compose.prod.yml logs -f backend

# View logs from last hour
docker-compose -f docker-compose.prod.yml logs --since 1h

# Search logs for errors
docker-compose -f docker-compose.prod.yml logs | grep -i error
```

### Resource Usage

```bash
# Monitor container resources
docker stats

# View detailed container info
docker inspect student-companion-backend | grep -E "Memory|Cpu"
```

### Application Metrics

```bash
# Database connection count
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d student_companion -c \
  "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Check for slow queries
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d student_companion -c \
  "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 5;"
```

### Uptime Monitoring

```bash
# Setup monitoring with uptime robot or similar
# Monitor: https://app.example.com/health
# Interval: 5 minutes
# Alert: On downtime
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
sudo systemctl status docker

# Check for port conflicts
sudo netstat -tlnp | grep -E '3000|5000|5432'

# Check disk space
df -h

# View service logs
docker-compose -f docker-compose.prod.yml logs backend
```

### Database Connection Issues

```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec backend \
  node -e "const pg = require('pg'); new pg.Client(process.env.DATABASE_URL).connect(console.log)"

# Check if Postgres is running
docker ps | grep postgres

# Check Postgres logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### Backend API Not Responding

```bash
# Check backend container status
docker-compose -f docker-compose.prod.yml ps backend

# View backend logs
docker-compose -f docker-compose.prod.yml logs -f backend --tail=100

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Frontend Not Serving

```bash
# Check frontend container status
docker-compose -f docker-compose.prod.yml ps frontend

# Check Nginx configuration
docker-compose -f docker-compose.prod.yml exec frontend \
  nginx -t

# View frontend logs
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### High Memory Usage

```bash
# Check which container is using memory
docker stats

# Adjust memory limits in docker-compose.prod.yml
# Add: deploy: { resources: { limits: { memory: 512M } } }

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

---

## Security Best Practices

### 1. Secrets Management

- ✅ Use environment variables for secrets
- ✅ Never commit .env files to Git
- ✅ Use secrets management service (AWS Secrets Manager, etc.)
- ❌ Don't hardcode API keys in code

### 2. Network Security

- ✅ Use HTTPS in production
- ✅ Enable CORS with specific origins
- ✅ Use private networks for database
- ✅ Restrict inbound ports (80, 443 for web; 5432 private)

### 3. Database Security

- ✅ Use strong passwords (20+ characters)
- ✅ Enable SSL/TLS for database connections
- ✅ Regular backups with encryption
- ✅ Restrict database access to backend only
- ❌ Don't expose database port to public internet

### 4. Application Security

- ✅ Keep dependencies updated
- ✅ Run security audits: `npm audit`
- ✅ Use HTTPS everywhere
- ✅ Implement rate limiting (already done)
- ✅ Validate all inputs

### 5. Container Security

- ✅ Use specific image versions (not `latest`)
- ✅ Run as non-root user (already done in Dockerfile)
- ✅ Remove unnecessary packages
- ✅ Scan images for vulnerabilities

### 6. SSL/TLS Setup

```bash
# Option 1: Let's Encrypt with Certbot
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d app.example.com

# Option 2: Manual certificate
# Place cert at: /etc/student-companion/ssl/cert.pem
#         key: /etc/student-companion/ssl/key.pem

# Option 3: Cloudflare/AWS Certificate Manager
# (Use native support for HTTPS)
```

---

## Deployment Checklist

- [ ] Database prepared and accessible
- [ ] Environment variables configured
- [ ] Docker images built
- [ ] Health checks passing
- [ ] SSL/TLS configured
- [ ] Backups tested
- [ ] Monitoring setup
- [ ] Logging configured
- [ ] Incident response plan ready
- [ ] Team trained on deployment
- [ ] Documentation updated

---

## Support

For deployment issues:
1. Check logs: `docker-compose logs`
2. Test connectivity: `curl localhost:5000/health`
3. Review configuration: Check `.env` and `docker-compose.prod.yml`
4. Check resources: `docker stats`

---

**Last Updated:** 2024-01-17
**Maintained By:** Development Team
