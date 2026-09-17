FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
# tsc only emits compiled .js; the migration SQL must be copied alongside it by hand.
RUN cp -r src/db/migrations dist/db/migrations

EXPOSE 3000

CMD ["npm", "run", "start:container"]
