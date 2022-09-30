#!/bin/sh
set -e

DOCKERINFO=$(curl -s --unix-socket /var/run/docker.sock http://docker/containers/json)
echo $DOCKERINFO > /docker.json
export CONTAINER_ID=`node -e "const data = require('/docker.json'); console.log(data.find(x => /ubuntu\-docker/.test(x.Image)).Id);"`
docker network connect testing_txs_base_net $CONTAINER_ID

exec "$@"
