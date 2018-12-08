import { Component, OnInit, Input, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-annotation-top-list',
  templateUrl: './annotation-top-list.component.html',
  styleUrls: ['./annotation-top-list.component.css']
})
export class AnnotationTopListComponent implements OnInit {
  @Input()
  annotationList: Array<Object>;
  @Input()
  changeTrigger = true;

  topList: Array<Object>; // sorted list to display

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    let tmpArray = [];
    for (let i = 0; i < this.annotationList.length; i++) {
      if (this.annotationList[i]['dBValue']) {
        tmpArray.push(this.annotationList[i]);
      }
    }
    tmpArray.sort((a, b) => b['dBValue'] - a['dBValue']);

    this.topList = tmpArray.slice(0, 4);
  }

  ngOnInit() {}
}
