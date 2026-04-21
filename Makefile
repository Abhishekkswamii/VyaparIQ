.PHONY: up down build rebuild restart \
       logs logs-frontend logs-backend logs-ai logs-nginx logs-postgres logs-redis \
       shell shell-frontend shell-backend shell-ai shell-postgres shell-redis \
       status clean

# ── Lifecycle ──────────────────────────────────────────────────────
up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

rebuild:
	docker-compose up -d --build

restart:
	docker-compose restart

# ── Logs ───────────────────────────────────────────────────────────
logs:
	docker-compose logs -f

logs-frontend:
	docker-compose logs -f frontend

logs-backend:
	docker-compose logs -f backend

logs-ai:
	docker-compose logs -f ai-service

logs-nginx:
	docker-compose logs -f nginx

logs-postgres:
	docker-compose logs -f postgres

logs-redis:
	docker-compose logs -f redis

# ── Shell ──────────────────────────────────────────────────────────
shell:
	docker-compose exec frontend sh

shell-frontend:
	docker-compose exec frontend sh

shell-backend:
	docker-compose exec backend sh

shell-ai:
	docker-compose exec ai-service bash

shell-postgres:
	docker-compose exec postgres psql -U $${POSTGRES_USER:-smartcart} -d $${POSTGRES_DB:-smartcart}

shell-redis:
	docker-compose exec redis redis-cli

# ── Status ─────────────────────────────────────────────────────────
status:
	@echo "=== Container Status ==="
	@docker-compose ps
	@echo ""
	@echo "=== Health Checks ==="
	@docker inspect --format='{{.Name}}: {{if .State.Health}}{{.State.Health.Status}}{{else}}no healthcheck{{end}}' $$(docker-compose ps -q) 2>/dev/null || true

# ── Clean ──────────────────────────────────────────────────────────
clean:
	docker-compose down -v --rmi local --remove-orphans
