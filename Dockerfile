FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY index.js ./

USER node

EXPOSE 3000

CMD ["npm", "start"]