FROM node:24-alpine as builder

WORKDIR /usr/src/app
COPY package*.json .
RUN npm config set registry https://npm.iranserver.com/repository/npm/
RUN npm ci

FROM node:24-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/ /usr/src/app/
RUN rm -rf .next
COPY . ./
# Building the app
RUN npm run build
EXPOSE 4000
# Running the app
CMD [ "npm", "start" ]
