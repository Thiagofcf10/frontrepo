FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build
ENV NODE_ENV=production
# Allow overriding API URL at build time; default is empty so app can use '/api' paths
ENV NEXT_PUBLIC_API_URL=""
EXPOSE 3000
CMD ["npm", "run", "start"]
