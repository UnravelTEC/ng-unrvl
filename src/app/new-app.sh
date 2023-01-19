#!/bin/bash

# written by Michael Maier (s.8472@aon.at)
# 
# 21.01.2019   - intial release
#

# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# version 2 as published by the Free Software Foundation.

###
### Standard help text
###

if [ ! "$1" ] || [ "$1" = "-h" ] || [ "$1" = " -help" ] || [ "$1" = "--help" ]
then 
cat <<EOH
Usage: $0 [OPTIONS] 

$0 is a program to make new ut-apps fast (before ng schematics are implemented)

OPTIONS:
   -h -help --help     this help text

  {app-name} - the app will be created in ut-apps/\$app-name

EOH
exit
fi

###
### variables
###

appname="$1"

###
### working part
###

mypath=ut-apps/$appname

ng g m $mypath --routing
ng g c $mypath

componentName=$(grep "export class" $mypath/$appname.component.ts | cut -f 3 -d" ")

newRoutesCode="\
import { $componentName } from './$appname.component';\
\
const routes: Routes = [\
  {\
    path: '', \
    component: $componentName\
  }\
];\
"

cd $mypath

mv $appname-routing.module.ts $appname-routing.module.ts.tmp
head -2 $appname-routing.module.ts.tmp > $appname-routing.module.ts.head
echo $newRoutesCode > $appname-routing.module.ts.routes
tail -6 $appname-routing.module.ts.tmp > $appname-routing.module.ts.tail

cat $appname-routing.module.ts.head \
    $appname-routing.module.ts.routes \
    $appname-routing.module.ts.tail \
  > $appname-routing.module.ts

rm $appname-routing.module.ts.head $appname-routing.module.ts.routes $appname-routing.module.ts.tail $appname-routing.module.ts.tmp

echo "in *-module.ts:          add needed imports like UtDygraphModule and FormsModule"
echo "in *-component.ts:       constructor (public gss: GlobalSettingsService) {"
echo "                           this.gss.emitChange({ appName: '$appname' }); }"
echo "in dashboard/comp.html:  add the tile"
echo "in /app.module.ts:       add the route"
