FROM node:12.16.3
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY src /src
RUN mkdir -p /logs
RUN npm build
CMD ["node", "./dist/index.js"]
