FROM node:10.11.0-jessie

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY public /usr/src/app/public
COPY src /usr/src/app/src

RUN yarn install

CMD [ "yarn", "start" ]