This project is the UI for the Inovia v2t system.

## Available Scripts

In the project directory, you can run:

### `yarn start`

# To build the docker image
### `docker build -t v2t-ui .`

# To run it using Docker


### `docker run -it ${PWD}:/usr/src/app -v /usr/src/app/node_modules -p 3000:3000 --rm v2t-ui`