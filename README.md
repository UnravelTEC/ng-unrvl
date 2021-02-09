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
