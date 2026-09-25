FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# The build's output depends on the clock: a post dated in the future is left
# out until a build after its `pubDatetime`. Docker's cache cannot see that, so
# deploy.yml passes a new BUILD_ID on every run, and this step never comes from
# cache. Without it, the daily scheduled rebuild could serve yesterday's site.
ARG BUILD_ID
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
