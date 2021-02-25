# ng-unrvl

Angular Frontend to visualize data - from endpoints Influx and MQTT


# Building

```
npm install

npm run build.prod
OR build.sh
```

The built project can now be found in `dist/Web`.

# Developing

To application for development:

```
ng serve
```

Access it via http://localhost:4200


## VS code

to remove the experimentalDecorators warning in VSCode, open the root folder (this) - only then tsconfig.json is read by VS code

increase inotify handles:

add fs.inotify.max_user_watches=524288 to /etc/sysctl.conf, execute sysctl -p

## CORS

when developing with API with authentication, CORS may kick you. Currently, you have to deploy to test API with auth :-/


## Merging from develop

usually, branches like co2-ampel-logger have a different dashboard as develop

from https://stackoverflow.com/questions/6294355/git-how-to-exclude-files-from-merging/46526957#46526957

In each of your branches, add file .gitattributes in root.

For each branch, specified the files to be ignored at merging like this:

filename merge=ours

and dont forget to activate the driver for that:

git config --global merge.ours.driver true

