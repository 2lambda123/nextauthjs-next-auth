#!/usr/bin/env bash

CONTAINER_NAME=next-auth-typegoose-test

JEST_WATCH=false

# Is the watch flag passed to the script?
while getopts w flag
do
    case "${flag}" in
        w) JEST_WATCH=true;;
        *) continue;;
    esac
done

# Start db
docker run -d --rm -p 27017:27017 --name ${CONTAINER_NAME} mongo

echo "Waiting 3 sec for db to start..."
sleep 3

if $JEST_WATCH; then
    # Run jest in watch mode
    NODE_ENV=test npx jest tests --bail --watch
    # Only stop the container after jest has been quit
    docker stop "${CONTAINER_NAME}"
else
    # Always stop container, but exit with 1 when tests are failing
    if NODE_ENV=test npx jest --bail;then
        docker stop ${CONTAINER_NAME}
    else
        docker stop ${CONTAINER_NAME} && exit 1
    fi
fi