# DA Hack AI

Full-stack AI-powered development platform.

## Architecture

```
da-hack-ai/
├── api/          # Python FastAPI backend
├── ui/           # Next.js frontend
├── e2e/          # End-to-end tests
└── infra/        # Infrastructure code
```

## Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- [pnpm](https://pnpm.io/) - Fast package manager
- [uv](https://github.com/astral/uv) - Python package manager
- [Cursor](https://cursor.sh/) - Recommended IDE
- [pre-commit](https://pre-commit.com/) - Git hooks

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Start all services (database, redis, minio, API, UI)
docker-compose up

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - MinIO Console: http://localhost:9001
```

Database migrations run automatically on startup. To add new migrations, see `api/migrations/README.md`.

### Manual Setup

1. **Setup Development Environment**
```bash
# Install package managers
curl -fsSL https://get.pnpm.io/install.sh | sh -
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install git hooks
uvx pre-commit install

# Open in Cursor IDE
cursor dahack-ai.code-workspace
```

2. **Start Backend (API)**
```bash
cd api
uv venv
uv pip install -r requirements.txt
uv run main.py
```

3. **Start Frontend (UI)**
```bash
cd ui
pnpm install
pnpm dev
```

## Development

### Code Quality

```bash
# Format code
npx @biomejs/biome check --write

# Run pre-commit hooks manually
pre-commit run --all-files
```

### Project Init Commands

```bash
# UI component setup
pnpm dlx shadcn@latest init

# Python environment setup
uv init
```

### URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Testing

```bash
# Run e2e tests
cd e2e
# TODO: Add e2e test commands
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## Support

For support, email denis@tomilin.ai or join our Discord channel.
