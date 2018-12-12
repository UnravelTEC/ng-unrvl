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
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';

@Component({
  selector: 'app-annotations-editor',
  templateUrl: './annotations-editor.component.html',
  styleUrls: ['./annotations-editor.component.css']
})
export class AnnotationsEditorComponent implements OnInit {
  currentAnnotation: Experiment = {
    nr: undefined,
    series: 'test',
    x: undefined,
    shortText: '#1',
    text: 'String',
    maxDB: undefined,
    clapStart: undefined, // Date
    clapStop: undefined, // Date
    clapLength: undefined, // Number
    baseLine: undefined,
    dBs: undefined
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

  @Input()
  serverHostName: string;
  @Input()
  serverPath: string;
  @Input()
  serverPort: string;

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
    clapStop: undefined,
    clapLength: undefined
  };

  private intervalSubscription100ms: Subscription;
  private intervalSubscription10s: Subscription;
  private intervalSubscriptionClap1s: Subscription;
  private baseLine: number;
  public nowTic: Date;

  public allowSelection = true;

  constructor(
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    private h: HelperFunctionsService
  ) {}

  ngOnInit() {
    this.loadFromLocalStorage();

    this.intervalSubscription100ms = interval(100).subscribe(counter => {
      this.nowTic = new Date();
      if (this.experimentRunning) {
        this.requestRunningAverage.emit(new Date(this.nowTic.valueOf() - 1000));
        this.currentAnnotation['clapLength'] =
          (this.nowTic.valueOf() -
            this.currentAnnotation['clapStart'].valueOf()) /
          1000;
        this.saveToLocalStorage();
      }
    });
    // this.intervalSubscription10s = interval(10000).subscribe(counter => {
    //   const url = `https://$(serverHostName):$(serverPort)/$(serverPath)query?query=`
    //   this.utHTTP
    //     .getHTTPData(url)
    //     .subscribe((data: Object) => this.loadData(data));
    // });
  }

  setBaseline(data: Object) {
    this.baseLine = parseFloat(data['data']['result'][0]['value'][1]);
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
    this.allowSelection = false;
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
      new Date(this.currentAnnotation['clapStart'].valueOf() - 1000)
    );
    this.saveToLocalStorage();

    this.intervalSubscriptionClap1s = interval(1000).subscribe(counter => {
      const now = new Date();
      this.currentAnnotation['ceilClapLength'] = Math.ceil(
        this.currentAnnotation.clapLength
      );
      const url =
        this.utHTTP.constructPrometheusEndPoint() +
        'query?query=avg_over_time(adc1_c1:avg_1s_b30[' +
        String(this.currentAnnotation['ceilClapLength']) +
        's])&time=' +
        now.toISOString();
      console.log(['clapstart: ', url]);
      this.utHTTP.getHTTPData(url).subscribe((data: Object) => {
        const dBsAverage = this.h.getDeep(data, [
          'data',
          'result',
          0,
          'value',
          1
        ]);
        console.log(dBsAverage, this.currentAnnotation['ceilClapLength']);
        this.currentAnnotation.dBs = dBsAverage * this.currentAnnotation['ceilClapLength'];
      });
    });
  }

  stop(Experiment?: Object) {
    this.allowSelection = true;

    this.intervalSubscriptionClap1s.unsubscribe();
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

interface Experiment {
  series: string;
  nr: string;
  shortText: string;
  text: string;
  maxDB: number;
  x: Date;
  clapStop: Date;
  clapStart: Date;
  baseLine: number;
  clapLength: number;
  dBs: number;
}
