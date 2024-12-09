#!/bin/bash

_mode=$1
if [ -n "$_mode" ]
then
  if [[ "$_mode" == "testing" || "$_mode" == "develop" ]]
  then
    echo $_mode
  else
    echo "Wrong mode $_mode given."
    exit 1;
  fi
else
    echo "No mode given."
    exit 1;
fi

_op=$2
if [ -n "$_op" ]
then
  if [[ "$_op" == "up" || "$_op" == "down" ||  "$_op" == "pull" ]]
  then
    echo $_op
  else
    echo "Wrong operation $_op given."
    exit 1;
  fi
else
    echo "No operation given."
    exit 1;
fi


composeConfigs=`find -type f -name docker-compose.yml | grep ${_mode}`
command="docker compose "
for i in $composeConfigs ; do
  command="$command -f $i";
done
command="$command $_op"

echo $command
exec $command

# echo $compose

# docker
