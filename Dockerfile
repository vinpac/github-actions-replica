FROM node:8.15.0-alpine as base
WORKDIR /usr/src
COPY package.json yarn.lock /usr/src/
RUN yarn install
COPY . .
RUN yarn build


FROM node:8.15.0-alpine
WORKDIR /usr/src
COPY --from=base /usr/src/package.json /usr/src/yarn.lock ./
ENV NODE_ENV="production"
RUN yarn --production
COPY --from=base /usr/src/next.config.js .
COPY --from=base /usr/src/.next ./.next
COPY --from=base /usr/src/static ./static
EXPOSE 3000
CMD ["npm", "start"]
