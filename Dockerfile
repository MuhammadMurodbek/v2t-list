FROM node:10.11.0-jessie

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/

RUN yarn install

CMD [ "yarn", "start" ]