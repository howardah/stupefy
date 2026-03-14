FROM oven/bun:1 AS deps

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build

COPY . .
RUN bun run build

FROM oven/bun:1-slim AS runtime

WORKDIR /app

ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/.output ./.output
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]
