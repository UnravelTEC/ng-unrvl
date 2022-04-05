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

if [ "$TARGET" = "ngbeta" ]; then
  rsync -ravx --delete dist/Web/* root@newton.unraveltec.com:/var/www/ngbeta/
  exit
fi

if [ "$TARGET" = "deb" ]; then
  rsync -ravx --delete dist/Web/* ../Debian/ng-unrvl-builds/ng/
  exit
fi


if [ "$2" ]; then
  target_path="$2"
fi

###
### working part
###

ssh root@$TARGET mkdir -p $target_path

# echo "cleaning target dir"
# ssh root@$TARGET rm -rf $target_path/*
echo rsync -ravx --delete dist/Web/* root@$TARGET:$target_path
rsync -ravx --delete dist/Web/* root@$TARGET:$target_path
echo "remount-rw"
ssh root@$TARGET remount-rw
echo "cleaning persistent dir"
ssh root@$TARGET rm -rf "/mnt/lower/$target_path/*"
echo "copying to persistent"
ssh root@$TARGET cp -ra "$target_path/*" /mnt/lower/$target_path/

# ssh root@$TARGET systemctl restart kiosk
