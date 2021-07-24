import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import {
  latLng,
  Map,
  MapOptions,
  tileLayer,
  ZoomAnimEvent,
  geoJSON,
} from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements OnInit, OnDestroy {
  @Output() map$: EventEmitter<Map> = new EventEmitter();
  @Output() zoom$: EventEmitter<number> = new EventEmitter();
  geojsonObj: GeoJSON.Feature<any> = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [15.421154166666666, 47.09932516666667],
        [15.421522, 47.102269666666665],
        [15.421682833333334, 47.1025895],
      ],
    },
  };

  geojsonlayer = geoJSON(this.geojsonObj);
  @Input() layers = [this.geojsonlayer]; // only for initialisation
  @Input() z = 13;
  @Input() x = 15.5;
  @Input() y = 47;

  public OSMofflineLayer = tileLayer('/assets/tiles/{z}/{x}/{y}.png', {
    opacity: 0.7,
    minZoom: 13,
    maxZoom: 13,
  });
  public OSMonlineLayer = tileLayer(
    'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      opacity: 0.7,
      detectRetina: true,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  );

  @Input() options: MapOptions = {
    layers: [this.OSMofflineLayer], // only one baselayer -> default layer
    zoom: this.z,
    center: latLng(this.y, this.x),
  };

  public layersControl = {
    baseLayers: {
      'OpenStreetMap offline': this.OSMofflineLayer,
      'OpenStreetMap online': this.OSMonlineLayer,
    },
    overlays: { Data: this.layers },
  };

  public map: Map;
  public zoom: number;

  constructor() {}

  ngOnInit() {
    console.log('x:', this.x, 'y:', this.y, 'z:', this.z);
  }

  ngOnDestroy() {
    console.log('map ngOnDestroy called');

    this.map.clearAllEventListeners();
    console.log('map clearAllEventListeners() called');
    // this.map.remove();
    console.log('map removed');
  }

  onMapReady(map: Map) {
    this.map = map;
    this.map.setView([this.y, this.x], this.z);
    this.map$.emit(map);
    this.zoom = map.getZoom();
    this.zoom$.emit(this.zoom);
  }

  onMapZoomEnd(e: ZoomAnimEvent) {
    this.zoom = e.target.getZoom();
    this.zoom$.emit(this.zoom);
  }
  zoomToBounds() {
    this.map.fitBounds(this.layers[0].getBounds());
  }
}
