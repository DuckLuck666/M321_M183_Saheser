FROM node:20


WORKDIR /backend

COPY backend/package.json ./

RUN rm -rf node_modules package-lock.json && npm install
COPY backend/ .

EXPOSE 3000
CMD [ "node", "api.js" ]