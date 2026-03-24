# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/apps/backend/prisma.config.ts ./

# 👉 NUEVO: Copiar el script de inicio
COPY --from=builder /app/apps/backend/entrypoint.sh ./entrypoint.sh
# 👉 NUEVO: Asegurar que el usuario nestjs pueda ejecutarlo
RUN chmod +x ./entrypoint.sh && chown nestjs:nodejs ./entrypoint.sh

USER nestjs

EXPOSE 3005

# 👉 NUEVO: Usar el script como punto de entrada
ENTRYPOINT ["./entrypoint.sh"]

# El CMD ahora son los argumentos que recibe el ENTRYPOINT
CMD ["node", "dist/src/main"]