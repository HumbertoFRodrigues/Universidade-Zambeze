# Como inserir os seeds actualizado

docker compose down -v
docker compose up --build -d --wait
docker compose exec backend npm run db:seed -w backend