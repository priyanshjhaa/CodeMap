FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm ci --include=dev

FROM deps AS build
COPY tsconfig.base.json ./
COPY apps/api apps/api
COPY packages packages
RUN npm --workspace @codemap/api run prisma:generate
RUN npm --workspace @codemap/api run build

FROM base AS runtime
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm ci --omit=dev
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/node_modules/.prisma node_modules/.prisma
COPY --from=build /app/node_modules/@prisma node_modules/@prisma
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
