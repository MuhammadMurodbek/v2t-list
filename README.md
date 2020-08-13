This project is the UI for the Inovia v2t system.

## Available Scripts

In the project directory, you can run:

`yarn start`

## To build the docker image
`docker build -t v2t-ui .`

## To run it using Docker
`docker run -it -v ${PWD}:/usr/src/app -v /usr/src/app/node_modules -p 3000:3000 --rm v2t-ui`

## Release
To create release:


Run latest Master branch pipeline with RELEASE flag = TRUE


Copy release version from pipeline


Rename current open milestone with release version and close it. (Create new milestone for further user)


Update https://gitlab.inoviagroup.se/patronum/v2t/v2t-env/-/blob/master/releases.yml with release version.