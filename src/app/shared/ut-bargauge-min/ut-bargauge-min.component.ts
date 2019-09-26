import { Component, OnInit, Input } from '@angular/core';
import { min } from 'lodash-es';
import { stringify } from 'querystring';

@Component({
  selector: 'app-ut-bargauge-min',
  templateUrl: './ut-bargauge-min.component.html',
  styleUrls: ['./ut-bargauge-min.component.scss']
})
export class UtBargaugeMinComponent implements OnInit {
  @Input()
  value: number;

  @Input()
  height = 100;

  @Input()
  width = 100;

  @Input()
  min = 0;
  @Input()
  max = 3000;

  @Input()
  highlights: string;

  @Input()
  barstyle: string;

  public bar_progress = false;
  public needle = true;

  constructor() {}

  ngOnInit() {
    const range = this.max - this.min;
    if (!this.highlights) {
      this.highlights =
        '[ {"from": ' +
        String(this.min) +
        ', "to": ' +
        String(range / 3) +
        ', "color": "green"},' +
        '{"from": ' +
        String(range / 3) +
        ', "to": ' +
        String((range / 3) * 2) +
        ', "color": "yellow"},' +
        '{"from": ' +
        String((range / 3) * 2) +
        ', "to": ' +
        String(this.max) +
        ', "color": "red"} ]';
    }

    if (this.barstyle === 'filled') {
      this.bar_progress = true;
      this.needle = false;
    }
  }
}
