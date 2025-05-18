FROM node:18


WORKDIR /app


COPY sub/package*.json ./
RUN npm install

COPY sub/ .


CMD ["node", "subscriber.js"]
