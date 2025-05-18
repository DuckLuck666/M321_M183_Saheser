FROM node:18

WORKDIR /app

COPY anzeige/package*.json ./
RUN npm install

COPY anzeige/ .

CMD ["node", "anzeige.js"]
