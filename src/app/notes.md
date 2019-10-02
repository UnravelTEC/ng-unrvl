https://angular.io/guide/lazy-loading-ngmodules

ng generate module ut-dashboard --routing
ng generate component ut-dashboard/dashboard

ng generate module ut-settings --routing
ng generate component ut-settings/settings-panel

in ut-dashboard-routing.module.ts die Komponenten
  import { DashboardComponent } from './dashboard/dashboard.component'
in die Routen hinzufügen
  {
    path: '',
    component: SettingsPanelComponent
  }

wenn man die komponente gleich benennt wie das modul und nach dem modul erzeugt, fügt ers gleich in die module.ts ein. in die routing.ts muss ma trotzdem eintragen!

Note on Interfaces
  this.utFetchdataService.getHTTPData().subscribe( (data: singleValue) => ...

wenn das singleValue net definiert ist, kompilierts mit ng serve beim 1.Mal nicht, beim 2. schon - was das Bugfixen unglaublich "einfach" macht...
  2nd Note: einfach als typ "Object" angeben, dann kann man sich das Interface sparen.



# how to add an app:
ng g m ut-apps/co2-graph --routing
ng g c ut-apps/co2-graph

##  edit -routing.module.ts, add
    import { Co2GraphComponent } from './co2-graph.component';
    add it to Routes = [ 
      {
        path: '',
        component: IaqComponent
      }
]

## in -module.ts
  add needed imports like Dygraphs and Forms

## in dashboard/comp.html add the tile

## in /app.module.ts, add the route



# App Info
title
path Apps/$path
component/module path
Class name


# Use of feature modules

* import into module.ts
* mention in @imports
# in module.ts, export the module's component

# DyGraphs:

laut https://www.npmjs.com/package/ng-dygraphs

npm install ng-dygraphs --save

From: https://github.com/mpx200/ng-dygraphs

~/uni/unraveltec/Frontend/Web # 

note:the dygraphs module must be injected in the submodule where it is used.


note on ng-dygraphs:
  it reloads with 500ms timeout - this is bad!
  and it draws _completely new_ each time!

dygraph css - you have to disable ng component encapsulation
  beim absolute positionieren alle 4 seiten-abstände angeben!

# deployment 

cd /Frontend/Web/src/app; npm run build.prod
scp -r ../../dist/Web/* root@co2-mm.lan://var/www/ng/ #*

test:
  in private browser window -> should use Newton
  localhost with server Henri
  on Henri
  on a co2-logger w/o screen



# Two-Way Databinding forms
https://angular.io/guide/forms

need
<form #myForm="ngForm">
<input [(ngModel)]="QueryString"
        name="QueryString"
              />
where QueryString is a member of the components class


# SCSS

ng config schematics.@schematics/angular:component.styleext scss


# air quality

co2 - graph
pm - graph
VOC - graph
rH - no graph, only bar
T - no graph, only bar

O3 - büro, aussen?
NO2

# Tiles

module.ts
  add
    exports: [TileLoadComponent]

ut-dashboard.module.ts
  add TileLoadModule to imports

## load-Tile

tile subscribes to mqtt +/system
gets pushed messages
updates its load indicator

need mqtt-status in top-bar
