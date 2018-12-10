import { Component, OnInit, Input, SimpleChanges } from '@angular/core';

import { interval, Subscription } from 'rxjs';

import { LocalStorageService } from '../../../core/local-storage.service';

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
  currentExperiment: string; // id: shortText

  @Input()
  getRunningAverage: number;

  topList: Array<Experiment>; // sorted list to display
  current: Experiment = {
    nr: '0',
    shortText: '.',
    text: '...',
    maxDB: 0
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

    let tmpArray: Array<Experiment> = [];
    let currentExperimentNumber = undefined;
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

    let rankNumber = undefined;
    for (let i = 0; i < tmpArray.length; i++) {
      if (tmpArray[i]['shortText'] == this.currentExperiment) {
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
  }
}

interface Experiment {
  nr: String;
  shortText: String;
  text: String;
  maxDB: number;
}
