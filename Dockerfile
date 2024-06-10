FROM node:16
WORKDIR /usr/src/app
COPY . .
RUN npm install
EXPOSE ${API_PORT}
CMD [ "npm", "start" ]
