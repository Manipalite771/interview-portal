FROM node:20-alpine
WORKDIR /app
COPY server.js index.html index-wioleta.html ./
EXPOSE 8080
CMD ["node", "server.js"]
