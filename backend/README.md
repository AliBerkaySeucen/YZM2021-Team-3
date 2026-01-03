# SWE Project Backend

FastAPI backend application with Supabase integration for managing users, nodes, memories, images, and links.

## Quick Start

### Using Docker (Recommended)

1. Set up environment variables in `app/.env`:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

2. Build and run with Docker Compose:
```bash
cd backend
docker-compose up --build
```

3. Access the API:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Manual Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r app/requirements.txt
```

3. Set up environment variables in `app/.env`

4. Run the application:
```bash
cd app
uvicorn main:app --reload
```

## API Endpoints

### Users
- `POST /users/register` - Register new user
- `POST /users/login` - User login
- `GET /users/me` - Get current user info

### Nodes
- `POST /nodes/create_node` - Create a new node
- `PUT /nodes/update_node` - Update node
- `DELETE /nodes/delete_node` - Delete node
- `POST /nodes/get_node_info` - Get node information

### Memories
- `POST /memories/create_memory` - Create a new memory
- `PUT /memories/update_memo` - Update memory
- `DELETE /memories/delete_memo` - Delete memory
- `POST /memories/get_memo_info` - Get memory information
- `POST /memories/add_node` - Add node to memory

### Images
- Image management endpoints

### Links
- Link management endpoints

## Testing

Run tests from the `backend/` directory:

```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

### Environment variables

Tests stub out Supabase access, but some endpoints still rely on auth settings. Set these as
needed for token-related tests:

* `SECRET_KEY`
* `ALGORITHM`
* `ACCESS_TOKEN_EXPIRE_MINUTES`

Supabase configuration (`SUPABASE_URL`, `SUPABASE_KEY`) is provided with test defaults in
`backend/tests/conftest.py` and can be overridden locally if desired.

## Docker Commands

Build the image:
```bash
docker build -t swe-backend .
```

Run the container:
```bash
docker run -p 8000:8000 --env-file app/.env swe-backend
```

Using docker-compose:
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build
```

## Project Structure

```
backend/
├── app/
│   ├── db/              # Database configuration
│   ├── models/          # Pydantic models
│   ├── routers/         # API route handlers
│   ├── services/        # Business logic
│   ├── main.py          # Application entry point
│   └── requirements.txt # Python dependencies
├── tests/               # Test files
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
└── .dockerignore        # Docker build exclusions
```
