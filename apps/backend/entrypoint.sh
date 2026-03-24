#!/bin/sh
# entrypoint.sh

echo "Ejecutando migraciones de Prisma..."
npx prisma migrate deploy

echo "Iniciando la aplicación..."
# Ejecuta el comando que se le pase (en este caso, node dist/src/main)
exec "$@"