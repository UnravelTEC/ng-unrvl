#!/bin/bash

# written by Michael Maier (s.8472@aon.at)
# 
# 18.01.2019   - intial release
#

# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# version 2 as published by the Free Software Foundation.

###
### Standard help text
###

target_path="/var/www/ng/"

if [ ! "$1" ] || [ "$1" = "-h" ] || [ "$1" = " -help" ] || [ "$1" = "--help" ]
then 
cat <<EOH
Usage: $0 [OPTIONS] {target} [path]

$0 is a program to deploy the compiled code to a device (param 1)

the compiled code will be scp'd to \$TARGET:\$path


OPTIONS:
  -h -help --help     this help text

  {target}            hostname, required
  [path]              optional (defaults to $target_path)

EOH
exit
fi

###
### variables
###

TARGET="$1"

if [ "$2" ]; then
  target_path="$2"
fi

###
### working part
###

ssh root@$TARGET mkdir -p $target_path

echo scp -r dist/Web/* root@$TARGET:$target_path
scp -r dist/Web/* root@$TARGET:$target_path

ssh root@$TARGET systemctl restart kiosk
