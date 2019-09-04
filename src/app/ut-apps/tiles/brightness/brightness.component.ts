import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-tile-brightness',
  templateUrl: './brightness.component.html',
  styleUrls: ['./brightness.component.scss']
})
export class BrightnessComponent implements OnInit {
  public value: number;

  @Input()
  height = 100;

  @Input()
  width = 100;

  constructor() {}

  ngOnInit() {}
}
