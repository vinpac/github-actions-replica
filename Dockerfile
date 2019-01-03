FROM node:8.15.0-alpine as base
WORKDIR /usr/src
COPY package.json yarn.lock /usr/src/
RUN yarn install
COPY . .
RUN yarn build && yarn --production
RUN rm -rf pages loader lib components styles types .babelrc .dockerignore .gitignore gulpfile.js now.json tslint.json


FROM node:8.15.0-alpine
WORKDIR /usr/src
ENV NODE_ENV="production"
COPY --from=base /usr/src .
EXPOSE 3000
CMD ["npm", "start"]
