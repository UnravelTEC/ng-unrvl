import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

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

  edit = {
    x: false,
    clapStart: false,
    clapEnd: false
  };

  private currentlyDisplayedExperiment = <any>{
    x: undefined,
    shortText: undefined,
    text: undefined,
    clapStart: undefined,
    clapEnd: undefined
  };

  constructor() {}

  ngOnInit() {}

  setCurrent(newCurrent) {
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

    this.requestRunningAverage.emit(
      new Date(this.currentAnnotation['clapStart'] - 1000)
    );
  }
  stop(Experiment?: Object) {
    if (!Experiment) {
      Experiment = this.currentAnnotation;
    }
    if (!Experiment['clapStop']) {
      const stopdate = new Date().valueOf();

      this.setDateInField(this.currentAnnotation.shortText, 'clapStop');
    }
    this.requestRunningAverage.emit(null);
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
}
