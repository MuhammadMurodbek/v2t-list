FROM nginx:alpine

RUN mkdir -p /www
COPY build/static /www
COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
