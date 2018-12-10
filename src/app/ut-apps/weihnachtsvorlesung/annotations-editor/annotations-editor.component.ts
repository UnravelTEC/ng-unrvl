import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { interval, Subscription } from 'rxjs';

import { LocalStorageService } from '../../../core/local-storage.service';
import{ UtFetchdataService } from '../../../shared/ut-fetchdata.service'

@Component({
  selector: 'app-annotations-editor',
  templateUrl: './annotations-editor.component.html',
  styleUrls: ['./annotations-editor.component.css']
})
export class AnnotationsEditorComponent implements OnInit {
  currentAnnotation = {
    series: 'test',
    x: 2,
    shortText: '#1',
    text: 'String',
    maxDB: undefined
  };

  @Input()
  annotationList: Array<Object>;
  @Input()
  annotationList2: Array<Object>;

  expanded = true;

  @Output()
  triggerChange = new EventEmitter<number>();
  @Output()
  setNewCurrentExperiment = new EventEmitter<string>(); // id: shortText

  @Output()
  requestRunningAverage = new EventEmitter<Date>();
  @Input()
  getRunningAverage: number;
  experimentRunning = false;

  edit = {
    x: false,
    clapStart: false,
    clapStop: false
  };

  private currentlyDisplayedExperiment = <any>{
    x: undefined,
    shortText: undefined,
    text: undefined,
    clapStart: undefined,
    clapStop: undefined
  };

  private intervalSubscription: Subscription;
  public nowTic: Date;

  constructor(private localStorage: LocalStorageService, private utHTTP: UtFetchdataService) {}

  ngOnInit() {
    this.loadFromLocalStorage();

    this.intervalSubscription = interval(100).subscribe(counter => {
      this.nowTic = new Date();
      if(this.experimentRunning) {
        this.requestRunningAverage.emit(
          new Date(this.nowTic.valueOf() - 1000)
        );
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      this.currentlyDisplayedExperiment['clapStart'] &&
      !this.currentlyDisplayedExperiment['clapStop']
    ) {
      if (this.currentlyDisplayedExperiment.maxDB < this.getRunningAverage) {
        this.currentlyDisplayedExperiment.maxDB = this.getRunningAverage;
        this.saveToLocalStorage();
      }
    }
  }

  setCurrent(newCurrent) {
    // const oldCurrentId = this.currentAnnotation.shortText;
    this.loadFromLocalStorage();

    this.currentAnnotation = newCurrent;
    this.triggerChange.emit(1);
  }

  adjustTime(key: string, secondsToAdjust: number) {
    this.currentAnnotation[key] += secondsToAdjust * 1000; // x is in ms

    const index = this.currentAnnotation['shortText'];
    this.annotationList2.forEach(element => {
      if (element['shortText'] == index) {
        element[key] += secondsToAdjust * 1000;
      }
    });
    this.saveToLocalStorage();
  }

  toggleDisplay() {
    this.expanded = !this.expanded;
  }

  setDateInField(elementId: string, field: string) {
    // id = shortText
    for (let i = 0; i < this.annotationList.length; i++) {
      let elem = this.annotationList[i];
      if (elem['shortText'] == elementId) {
        elem[field] = new Date().valueOf();
        this.annotationList2[i][field] = elem[field];
        break;
      }
    }
  }
  set() {
    // if something running, stop
    if (
      this.currentlyDisplayedExperiment['clapStart'] &&
      !this.currentlyDisplayedExperiment['clapStop']
    ) {
      this.stop(this.currentlyDisplayedExperiment);
    }

    // if an old exp. has not started yet - we need to set start/stop dates so we can edit it later
    if (!this.currentlyDisplayedExperiment['clapStart']) {
      this.setDateInField(
        this.currentlyDisplayedExperiment.shortText,
        'clapStart'
      );
      this.setDateInField(
        this.currentlyDisplayedExperiment.shortText,
        'clapStop'
      );
    }

    // set date in both lists
    this.setDateInField(this.currentAnnotation.shortText, 'x');

    this.currentlyDisplayedExperiment = this.currentAnnotation;

    // emit to top-list component
    this.setNewCurrentExperiment.emit(this.currentAnnotation.shortText);
    this.saveToLocalStorage();
    this.localStorage.set(
      'currentExperiment',
      this.currentAnnotation.shortText
    );
  }

  start() {
    // if something running, stop
    if (
      this.currentlyDisplayedExperiment['clapStart'] &&
      !this.currentlyDisplayedExperiment['clapStop']
    ) {
      this.stop(this.currentlyDisplayedExperiment);
    }

    // set start date on all lists
    this.setDateInField(this.currentAnnotation.shortText, 'clapStart');

    this.experimentRunning = true;
    this.requestRunningAverage.emit(
      new Date(this.currentAnnotation['clapStart'] - 1000)
    );
    this.saveToLocalStorage();
  }

  stop(Experiment?: Object) {
    if (!Experiment) {
      Experiment = this.currentAnnotation;
    }
    if (!Experiment['clapStop']) {
      const stopdate = new Date().valueOf();

      this.setDateInField(Experiment['shortText'], 'clapStop');
    }

    this.experimentRunning = false;
    this.requestRunningAverage.emit(null);
    this.saveToLocalStorage();
  }

  show(which: string) {
    this.edit[which] = !this.edit[which];
  }
  delete() {
    for (let i = 0; i < this.annotationList.length; i++) {
      if (this.annotationList[i]['x'] == this.currentAnnotation['x']) {
        this.annotationList.splice(i, 1);
        this.annotationList2.splice(i, 1);
      }
    }
  }

  saveToLocalStorage() {
    this.localStorage.set('annotations.' + 'miclvl', this.annotationList);
  }

  // element-for-element copy, to preserve data binding
  loadFromLocalStorage() {
    let localAnnotations = this.localStorage.get('annotations.' + 'miclvl');
    if (!localAnnotations) {
      console.log('not loading from localStorage, empty.');
      return;
    }

    // first, delete every annotation not in LocalStorage
    let toDelete = [];
    for (let i = 0; i < this.annotationList.length; i++) {
      let elem = this.annotationList[i];
      let found = false;
      localAnnotations.forEach(annotation => {
        if (elem['shortText'] == annotation['shortText']) {
          found = true;
        }
      });
      if (!found) {
        console.log([
          'loadFromLocalStorage: deleting ',
          this.annotationList[i]
        ]);
        delete this.annotationList[i];
      }
    }
    // TODO reindex

    localAnnotations.forEach(annotation => {
      for (let i = 0; i < this.annotationList.length; i++) {
        let elem = this.annotationList[i];
        if (elem['shortText'] == annotation['shortText']) {
          for (const key in annotation) {
            if (annotation.hasOwnProperty(key)) {
              elem[key] = annotation[key];
            }
          }
          // delete if elemkey not in annotation
          for (const key in elem) {
            if (elem.hasOwnProperty(key)) {
              if (!annotation.hasOwnProperty(key)) {
                delete elem[key];
              }
            }
          }
        }
      }
    });
    this.triggerChange.emit(1);
  }

  save() {
    this.saveToLocalStorage();
    const url = 'https://scpexploratory02.tugraz.at/test/collector.php';
    this.utHTTP.postData(url, JSON.stringify(this.annotationList));

  }

  loadFromExt() {
    const url = 'https://scpexploratory02.tugraz.at/test/tmp/test.txt';
    this.utHTTP
    .getHTTPData(url)
    .subscribe((data: Object) => this.loadData(data));
  }
  loadData(data: Object) {
    console.log(data);
    this.localStorage.set('annotations.' + 'miclvl', data);
  }

  deleteLocalStorage() {
    console.log('DELETING');
    console.log(this.localStorage.get('annotations.' + 'miclvl'));
    this.localStorage.delete('annotations.' + 'miclvl');
  }
}
