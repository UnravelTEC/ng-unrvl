import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';

import { GlobalSettingsService } from '../../core/global-settings.service';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
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

  min_tilesize = 140; // px

  constructor(private globalSettings: GlobalSettingsService) {
    // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.globalSettings.emitChange({ appName: 'Dashboard' });
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
