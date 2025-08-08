FROM node:18-alpine
WORKDIR /app
RUN npm install -g npm@9
COPY package*.json ./
COPY packages ./packages
# COPY themes ./themes
COPY extensions ./extensions
COPY public ./public
# COPY media ./media
COPY config ./config
COPY translations ./translations
RUN npm install
RUN npm run compile
WORKDIR /app/packages/postgres-query-builder
RUN npm install
RUN npm run compile
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN npm run build

EXPOSE 80
CMD ["npm", "run", "start"]
