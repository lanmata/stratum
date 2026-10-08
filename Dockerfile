# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY angular.json tsconfig*.json postcss.config.json ./
COPY src ./src
COPY public ./public
RUN pnpm exec ng build --configuration production

FROM node:24-alpine
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production \
    PORT=7008
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod
COPY server.js ./
COPY server ./server
COPY --from=build /app/dist ./dist
RUN mkdir -p /app/logs && chown -R node:node /app
USER node
EXPOSE 7008
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "const h=(process.env.NG_ALLOWED_HOSTS||'localhost').split(',')[0].trim();require('https').get({host:'localhost',port:process.env.PORT,path:'/',headers:{host:h},rejectUnauthorized:false},r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "server.js"]
