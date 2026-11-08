FROM node:22.20.0-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --workspace backend --include-workspace-root=false --omit=dev
COPY db ./db
COPY backend ./backend
RUN npm run db:generate -w backend
ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["npm", "run", "start", "-w", "backend"]
