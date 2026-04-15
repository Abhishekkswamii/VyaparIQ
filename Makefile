.PHONY: up down build rebuild logs shell restart status clean

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

rebuild:
	docker-compose up -d --build

logs:
	docker-compose logs -f

shell:
	docker-compose exec frontend sh

restart:
	docker-compose restart

status:
	docker-compose ps

clean:
	docker-compose down -v --rmi local
