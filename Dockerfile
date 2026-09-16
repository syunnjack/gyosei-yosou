FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm test && npm run build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787 DATABASE_PATH=/data/gyosai.sqlite
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/src/materials.js /app/src/material-catalog.json ./src/
COPY --from=build /app/package.json ./
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 8787
VOLUME /data
CMD ["node","server/start.js"]
