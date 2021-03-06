import { Component, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';

import { interval, Subscription } from 'rxjs';

import { LocalStorageService } from '../../../core/local-storage.service';

@Component({
  selector: 'app-annotation-top-list',
  templateUrl: './annotation-top-list.component.html',
  styleUrls: ['./annotation-top-list.component.css']
})
export class AnnotationTopListComponent implements OnInit, OnChanges {
  @Input()
  annotationList: Array<Experiment>;
  @Input()
  changeTrigger = true;
  @Input()
  currentExperiment: string; // id: shortText

  @Input()
  getRunningAverage: number;

  topList: Array<Experiment>; // sorted list to display
  current: Experiment = {
    nr: '0',
    shortText: '.',
    text: '...',
    maxDB: 0,
    x: undefined,
    clapStop: undefined,
    clapStart: undefined,
    baseLine: undefined,
    clapLength: undefined,
    dBs: undefined
  };

  private intervalSubscription: Subscription;

  constructor(private localStorage: LocalStorageService) {}

  ngOnChanges(changes: SimpleChanges) {
    console.log('a-l.c: change triggered');
    this.refresh();
  }

  ngOnInit() {
    this.refresh();
    console.log(this.annotationList);

    this.intervalSubscription = interval(100).subscribe(counter => {
      this.refresh();
    });
  }

  refresh() {
    this.annotationList = this.localStorage.get('annotations.' + 'miclvl');
    if (!this.annotationList) {
      console.log('not loading from localStorage, empty.');
      return;
    }

    this.currentExperiment = this.localStorage.get('currentExperiment');
    // console.log(
    //   'get currentExperiment from localstorage' + this.currentExperiment
    // );

    const tmpArray: Array<Experiment> = [];
    let currentExperimentNumber;
    for (let i = 0; i < this.annotationList.length; i++) {
      const tmpExperiment = this.annotationList[i];
      if (tmpExperiment['dBs']) {
        tmpArray.push(tmpExperiment);
      }
      if (tmpExperiment['shortText'] === this.currentExperiment) {
        currentExperimentNumber = i;
      }
    }

    tmpArray.sort((a, b) => b['dBs'] - a['dBs']);

    let rankNumber;
    for (let i = 0; i < tmpArray.length; i++) {
      if (tmpArray[i]['shortText'] === this.currentExperiment) {
        rankNumber = i;
      }
    }
    this.topList = tmpArray.slice(0, 5);

    if (undefined === currentExperimentNumber) {
      return;
    }

    this.current = this.annotationList[currentExperimentNumber];
    this.current['nr'] =
      rankNumber !== undefined ? String(rankNumber + 1) : '-';

    // FIXME clapLength hier updaten
    // this.currentAnnotation['clapLength'] =
    // (this.nowTic.valueOf() -
    //   this.currentAnnotation['clapStart'].valueOf()) /
    // 1000;
  }
}

interface Experiment {
  nr: String;
  shortText: String;
  text: String;
  maxDB: number;
  x: Date;
  clapStop: Date;
  clapStart: Date;
  baseLine: number;
  clapLength: number;
  dBs: number;
}
