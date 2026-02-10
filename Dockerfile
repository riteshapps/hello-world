FROM node:alpine
COPY index.js .
CMD ["node", "index.js"]