import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-tile-co2',
  templateUrl: './tile-co2.component.html',
  styleUrls: ['./tile-co2.component.scss']
})
export class TileCo2Component implements OnInit {
  public value: number;

  @Input()
  height = 100;

  @Input()
  width = 100;

  highlights = '[ {"from": 0, "to": 415, "color": "green"}, \
                  {"from": 415, "to": 600, "color": "rgba(0, 128, 0, 0.7)"}, \
                  {"from": 600, "to": 1000, "color": "yellow"}, \
                  {"from": 1000, "to": 1500, "color": "orange"}, \
                  {"from": 1500, "to": 3000, "color": "red"} ]'

  constructor() { }

  ngOnInit() {
  }

}
