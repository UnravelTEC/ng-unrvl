#!/bin/bash

node git-version.js
ng build
cp src/environments/git-version.ts dist/Web/
