FROM node:10.11.0-jessie

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /usr/src/app/package.json
RUN yarn install
RUN yarn global add react-scripts@2.1.5

# start app
CMD ["yarn", "start"]
