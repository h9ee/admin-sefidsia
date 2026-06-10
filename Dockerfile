FROM node:24-alpine as builder

WORKDIR /usr/src/app
COPY package*.json .
RUN npm config set registry https://npm.iranserver.com/repository/npm/
RUN npm ci --legacy-peer-deps --verbose

FROM node:24-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/ /usr/src/app/
RUN rm -rf .next
COPY . ./

# `NEXT_PUBLIC_*` vars are inlined into the JS bundle at `next build` time,
# so they must be ARG+ENV here BEFORE `npm run build`. Without these the
# admin's axios baseURL becomes empty and every API call falls back to the
# admin's own origin (e.g. /auth/check-mobile instead of /apis/auth/...).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_URL_IMAGE
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL_IMAGE=$NEXT_PUBLIC_API_URL_IMAGE

# Building the app
RUN npm run build
EXPOSE 4000
# Running the app
CMD [ "npm", "start" ]
