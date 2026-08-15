# Контекст сборки — корень репозитория (npm workspaces: lock-файл лежит
# там, а не в backend/):
#   docker build -f backend/Dockerfile -t planly-backend .

# --- build stage ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci --workspace=backend

COPY backend ./backend
RUN npm run build --workspace=backend

# --- runtime stage ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci --workspace=backend --omit=dev

COPY --from=build /app/backend/dist ./backend/dist

EXPOSE 4000
CMD ["node", "backend/dist/server.js"]
