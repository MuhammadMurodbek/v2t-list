This project is the UI for the Inovia v2t system.

## Available Scripts

In the project directory, you can run:

### `yarn start`

# To build the docker image
### `docker build -t v2t-ui -f nginx/Dockerfile .`

# To run it using Docker


### `docker run -it -v ${PWD}:/usr/src/app -v /usr/src/app/node_modules -p 3000:3000 --rm v2t-ui`