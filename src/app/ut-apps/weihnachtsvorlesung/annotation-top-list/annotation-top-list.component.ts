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
  currentExperiment: string;

  topList: Array<Experiment>; // sorted list to display
  current: Experiment = {
    nr: '0',
    shortText: '.',
    text: '...',
    maxDB: 0
  };

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    let tmpArray: Array<Experiment> = [];
    let currentExperimentNumber = 0;
    for (let i = 0; i < this.annotationList.length; i++) {
      let tmpExperiment = this.annotationList[i];
      if (tmpExperiment['maxDB']) {
        tmpArray.push(tmpExperiment);
      }
      if (tmpExperiment['shortText'] == this.currentExperiment) {
        currentExperimentNumber = i;
      }
    }
    tmpArray.sort((a, b) => b['maxDB'] - a['maxDB']);

    let rankNumber = 0;
    for (let i = 0; i < tmpArray.length; i++) {
      if (tmpArray[i]['shortText'] == this.currentExperiment) {
        rankNumber = i;
      }
    }

    this.current = this.annotationList[currentExperimentNumber];
    this.current['nr'] = String(rankNumber);

    this.topList = tmpArray.slice(0, 4);
  }

  ngOnInit() {}
}

interface Experiment {
  nr: String;
  shortText: String;
  text: String;
  maxDB: number;
}
