FROM node:20

WORKDIR /usr/src/app

RUN npm install pm2 -g

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 9000

CMD ["pm2-runtime", "start", "app.js"]