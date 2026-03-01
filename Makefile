.PHONY: dev dev-frontend dev-backend install install-frontend install-backend lint test clean docker-up docker-down download-data

# Development
dev:
	@echo "Starting backend and frontend..."
	$(MAKE) dev-backend &
	$(MAKE) dev-frontend

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Installation
install: install-backend install-frontend

install-frontend:
	cd frontend && npm install

install-backend:
	cd backend && pip install -e ".[dev]"

# Data
download-data:
	@echo "Downloading per_language_results CSV..."
	curl -o backend/app/data/per_language_results.csv \
		https://raw.githubusercontent.com/facebookresearch/omnilingual-asr/main/per_language_results_table_7B_llm_asr.csv
	@echo "Done."

# Linting & Testing
lint:
	cd backend && ruff check app/
	cd frontend && npm run lint

test:
	cd backend && pytest tests/ -v

# Docker
docker-up:
	docker-compose up --build -d

docker-down:
	docker-compose down

# Cleanup
clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name node_modules -exec rm -rf {} +
	find . -type d -name .pytest_cache -exec rm -rf {} +
	rm -rf frontend/dist backend/*.egg-info
