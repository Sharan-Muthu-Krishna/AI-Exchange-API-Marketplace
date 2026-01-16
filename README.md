# AIExchange - AI API Marketplace & Gateway

A production-grade multi-tenant SaaS platform for AI API providers and consumers.

![AIExchange](https://img.shields.io/badge/AIExchange-v1.0.0-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)

## 🚀 Features

- **Multi-tenant Marketplace**: Vendors publish APIs, Buyers consume them
- **API Gateway**: Secure proxy for all API calls
- **JWT Authentication**: For human users (Admin, Vendor, Buyer)
- **API Key Authentication**: For software/programmatic access
- **Usage Tracking**: Detailed logs and analytics
- **Billing Simulation**: Credits, wallets, and platform commission
- **Modern UI**: Stripe-style dark theme with Tailwind CSS

## 🏗 Architecture

```
Frontend (Next.js 15)
        ↓
Backend (FastAPI)
        ↓
PostgreSQL Database
        ↓
Vendor API Endpoints
```

## 📦 Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, asyncpg |
| Database | PostgreSQL |
| Auth | JWT (users), SHA-256 hashed API keys |
| HTTP Client | httpx (async) |

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+

### 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE aiexchange;"
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Start server
uvicorn app.main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs


## 👤 Default Admin

- **Email**: admin@aiexchange.com
- **Password**: Admin@123



## 🔌 API Gateway Usage

### Subscribe to an API (Buyer)

```javascript
// 1. Create API key from buyer dashboard
// 2. Subscribe to an API from marketplace
// 3. Call the API via gateway:

fetch('http://localhost:8000/v1/apis/{api_id}/run', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ae_live_xxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ input: 'your data' })
});
```

## 🔐 Security

- JWT with configurable expiration
- Bcrypt password hashing
- API keys stored as SHA-256 hashes
- CORS configuration
- Rate limiting with SlowAPI

## 📊 Billing Flow

```
1. Buyer calls API
2. Gateway validates key + subscription
3. Check buyer credits
4. Proxy to vendor endpoint
5. On success:
   - Deduct from buyer wallet
   - Credit vendor (minus commission)
   - Log platform commission
```

## 📝 License

Sharan-Muthu-Krishna
