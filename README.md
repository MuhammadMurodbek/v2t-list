This project is the UI for the Inovia v2t system.

## Available Scripts

In the project directory, you can run:

## To develop on :8080
`yarn dev`

## To build the docker image
`docker build -t v2t-ui -f nginx/Dockerfile .`

## To run it using Docker on port :8000
`docker run -it -v ${PWD}:/usr/src/app -v /usr/src/app/node_modules -p 8000:80 --rm v2t-ui`

## Release
To create release:


Run latest Master branch pipeline with RELEASE flag = TRUE


Copy release version from pipeline


Rename current open milestone with release version and close it. (Create new milestone for further user)


Update https://gitlab.inoviagroup.se/patronum/v2t/v2t-env/-/blob/master/releases.yml with release version.
