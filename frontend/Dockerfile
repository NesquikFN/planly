# Контекст сборки — корень репозитория (npm workspaces: lock-файл лежит
# там, а не в frontend/):
#   docker build -f frontend/Dockerfile -t planly-frontend .

# --- build stage ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace=frontend

# NEXT_PUBLIC_* переменные вшиваются в клиентский бандл на этапе сборки,
# поэтому их нужно передать build-аргументом (Railway пробрасывает
# переменные сервиса как build args, когда имя ARG совпадает).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SESSION_COOKIE_NAME
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SESSION_COOKIE_NAME=$NEXT_PUBLIC_SESSION_COOKIE_NAME

COPY frontend ./frontend
RUN npm run build --workspace=frontend

# --- runtime stage ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# output: "standalone" (next.config.mjs) кладёт в .next/standalone
# самодостаточный сервер вместе с нужными зависимостями, поэтому
# npm ci на этом слое не нужен вовсе.
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static ./frontend/.next/static
COPY --from=build /app/frontend/public ./frontend/public

EXPOSE 3000
CMD ["node", "frontend/server.js"]
