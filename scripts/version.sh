#!/bin/bash

FILE=.version-pass
CHANGED=`npx lerna changed`
if [ $? -eq 0 ]; then
  echo "Changes found: $CHANGED"
  npx lerna version $1
  if [ $? -eq 0 ]; then
    git commit -a -m "build: update version"
    touch $FILE
    npm version $1
    rm $FILE
  fi
else
  echo "No changes to version."
fi



