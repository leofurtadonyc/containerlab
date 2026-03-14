FROM node:22-alpine@sha256:8094c002d08262dba12645a3b4a15cd6cd627d30bc782f53229a2ec13ee22a00 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-fund --no-audit

COPY public ./public
COPY src ./src
COPY index.html tsconfig.json vite.config.ts ./

RUN npm run build

FROM nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY scripts/start-app-web.sh /usr/local/bin/start-app-web.sh
COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod 755 /usr/local/bin/start-app-web.sh

EXPOSE 8088

HEALTHCHECK --interval=15s --timeout=3s --start-period=15s --retries=6 CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8088/"]

CMD ["/bin/sh", "/usr/local/bin/start-app-web.sh"]