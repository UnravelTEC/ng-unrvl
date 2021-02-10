#!/bin/bash

node git-version.js
ng build --prod
cp src/environments/git-version.ts dist/Web/
