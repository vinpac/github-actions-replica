FROM node:8.15.0-alpine
WORKDIR /usr/src
COPY package.json yarn.lock /usr/src/
RUN yarn install
COPY . .
RUN yarn build && yarn --production
ENV NODE_ENV="production"
EXPOSE 3000
CMD ["npm", "start"]
