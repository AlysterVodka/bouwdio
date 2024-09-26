FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY . .
RUN npm install pm2 -g

EXPOSE 8443

CMD ["pm2-runtime", "start", "app.js"]