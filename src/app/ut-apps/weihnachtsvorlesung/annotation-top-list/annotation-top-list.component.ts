import { Component, OnInit, Input, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-annotation-top-list',
  templateUrl: './annotation-top-list.component.html',
  styleUrls: ['./annotation-top-list.component.css']
})
export class AnnotationTopListComponent implements OnInit {
  @Input()
  annotationList: Array<Experiment>;
  @Input()
  changeTrigger = true;
  @Input()
  currentExperiment: Object;

  topList: Array<Experiment>; // sorted list to display
  current : Experiment = {
    nr: "0",
    shortText: ".",
    text: '...',
    maxDB: 0
  };

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    let tmpArray: Array<Experiment>;
    tmpArray = [];
    for (let i = 0; i < this.annotationList.length; i++) {
      if (this.annotationList[i]['maxDB']) {
        tmpArray.push(this.annotationList[i]);
      }
    }
    tmpArray.sort((a, b) => b['maxDB'] - a['maxDB']);

    this.topList = tmpArray.slice(0, 4);
    let top = "0";
    this.current = this.topList[top];
    this.current['nr'] = top;
  }

  ngOnInit() {}
}

interface Experiment {
  nr: String,
    shortText: String,
    text: String,
    maxDB: number
}