ARG NODE_BUILDER
FROM $NODE_BUILDER as BUILDER
ARG APP
ARG ENVIRONMENT
RUN yarn nx build $APP --configuration $ENVIRONMENT

FROM --platform=linux/amd64 us-east4-docker.pkg.dev/devstream-shared-services-4179/application/nginx-otel:0.3
ARG APP

# Update Installed packages
RUN apt-get update && \
  mkdir /etc/nginx/conf.d && \
  rm -f /var/log/nginx/error.log && \
  rm -f /var/log/nginx/access.log && \
  ln -s /dev/stdout /var/log/nginx/access.log && \
  ln -s /dev/stderr /var/log/nginx/error.log

WORKDIR /usr/share/nginx/

COPY --from=BUILDER /builder/dist/apps/$APP/ html/

COPY ./.ci/conf/nginx.conf /etc/nginx/nginx.conf

COPY ./.ci/conf/default.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
