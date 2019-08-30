import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../../app/core/global-settings.service';

@Component({
  selector: 'app-tcs34725',
  templateUrl: './tcs34725.component.html',
  styleUrls: ['./tcs34725.component.scss']
})
export class Tcs34725Component implements OnInit {
  title = 'ams TCS34725 Colorimeter';
  step = 1000;

  extraDyGraphConfig = {
    strokeWidth: 2.0,
    logscale: true,
    colors: ['blue', 'green', '#FF00FF', 'red', '#FFFF00']
  };
  graphstyle = {
    position: 'absolute',
    top: '3em',
    bottom: '0',
    left: '1vw',
    right: '16em'
  };

  public r: number;
  public g: number;
  public b: number;
  public htmlColor: string;

  dataSeriesLabels = ['SPS30'];
  labelBlackList = ['__name__', 'interval', 'sensor'];
  startTime = '15m';
  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: this.title });
  }
  ngOnInit() {}

  calcHTMLColor(r_lux, g_lux, b_lux) {
    let max = Math.max(r_lux, g_lux, b_lux);
    this.r = Math.round((r_lux / max) * 255);
    this.g = Math.round((g_lux / max) * 255);
    this.b = Math.round((b_lux / max) * 255);
    const r_hex = ('00' + this.r.toString(16)).substr(-2),
      g_hex = ('00' + this.g.toString(16)).substr(-2),
      b_hex = ('00' + this.b.toString(16)).substr(-2);
    this.htmlColor = '#' + r_hex + g_hex + b_hex;
    return this.htmlColor;
  }
}
