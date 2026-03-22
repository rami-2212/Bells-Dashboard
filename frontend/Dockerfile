FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

ENV REACT_APP_API_URL=http://localhost:3001
ENV REACT_APP_WS_URL=ws://localhost:3001/ws

CMD ["npm", "start"]
