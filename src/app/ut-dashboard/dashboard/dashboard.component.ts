import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';

import { GlobalSettingsService } from '../../core/global-settings.service';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('dashboard', { static: true })
  elementView: ElementRef;

  scrHeight: any;
  scrWidth: any;

  tilewidth = 200;
  tilewidth_px = '200px';
  tileheight = 200;
  tileheight_px = '200px';

  contentHeight: number;
  contentWidth: number;

  sensorAppRegistry = {
    // '': {
    //   description: '',
    //   icon: '',
    // },
    TSL2561: {
      description: 'Brightness',
      icon: 'manufacturers/Ams.svg  ',
    },
    DS18B20: {
      description: 'Temperature',
      icon: 'manufacturers/Maxim_Integrated.svg',
    },
    SCD30: {
      description: 'NDIR CO₂',
      icon: 'manufacturers/sensirion.png',
    },
    SPS30: {
      description: 'Particulate Matter',
      icon: 'manufacturers/sensirion.png',
    },
    BME280: {
      description: 'Environmental',
      icon: 'manufacturers/Bosch.svg',
    },
  };
  SAR = this.sensorAppRegistry;
  // EXSENSOR = {
  //   description: 'exampling',
  //   icon: 'example.png',
  // };

  appRegistry = {
    // '': {
    //   path: '',
    //   icon: '',
    //   queryParams: {},
    //   datafields: [{ '': '' }],
    // },
    'Indoor Climate': {
      path: 'I/IndoorClimate',
      datafields: [{ humidity: 'H2O_rel_percent' }],
    },
    Humidity: {
      path: 'I/Humidity',
      icon: '320px-Water_molecule.svg.png',
      datafields: [{ humidity: 'H2O_rel_percent' }],
    },
    'CO₂ Graph': {
      path: 'CO2',
      icon: '284px-Carbon_dioxide_3D_spacefill.png',
      datafields: [{ gas: 'CO2_ppm' }],
    },
    'Air Temperature': {
      path: 'Sensors/DS18B20',
      icon: 'noun_Temperature.png',
      datafields: [{ 'temperature': 'air_degC' }],
    },
    'Air Pressure': {
      path: 'I/Pressure',
      icon: '320px-Pressure_gauge.svg.png',
      datafields: [{ 'pressure': 'air_hPa' }],
    },
  };

  min_tilesize = 140; // px

  constructor(public gss: GlobalSettingsService) {
    // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.gss.emitChange({ appName: 'Dashboard' });
    this.getScreenSize();
    console.log('w:', this.tilewidth, 'h:', this.tileheight);
  }

  ngAfterViewInit() {
    this.calculateTileSize();
  }

  // does not work
  calculateTileSize() {
    // if (!this.elementView) {
    //   return;
    // }
    // this.contentHeight = this.elementView.nativeElement.offsetHeight;
    // this.contentWidth = this.elementView.nativeElement.offsetWidth;
    // const nr_tiles = Math.floor(this.contentWidth / this.min_tilesize);
    // console.log('this.contentWidth:', this.contentWidth, 'tiles:', nr_tiles);
    // console.log('this.contentHeight:', this.contentHeight);
    // let tilesize = Math.floor(this.contentWidth / nr_tiles);
    // setTimeout(() => {
    //   console.log('new tilesize:', tilesize);
    //   this.tilewidth = tilesize;
    //   this.tileheight = tilesize;
    // }, 50);
  }

  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    // if (!this.elementView) {
    this.scrHeight = window.innerHeight;
    this.scrWidth = window.innerWidth;
    console.log('new Windowsize:', this.scrWidth, this.scrHeight);

    const nr_tiles = Math.floor(this.scrWidth / this.min_tilesize);
    let tilesize = Math.floor((this.scrWidth - 30) / (nr_tiles * 1.02));
    this.tilewidth = tilesize;
    this.tilewidth_px = String(tilesize) + 'px';
    this.tileheight = tilesize;
    this.tileheight_px = String(tilesize) + 'px';
    console.log('new tilesize:', this.tileheight);

    // } else {
    //   this.calculateTileSize();
    // }
  }

  ngOnInit() {}
}
