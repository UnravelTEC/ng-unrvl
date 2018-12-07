import { Component, OnInit, ViewEncapsulation, SimpleChanges } from '@angular/core';
import { LocalStorageService } from '../../core/local-storage.service';
import { AnnotationsEditorComponent } from './annotations-editor/annotations-editor.component';

@Component({
  selector: 'app-weihnachtsvorlesung',
  templateUrl: './weihnachtsvorlesung.component.html',
  styleUrls: ['./weihnachtsvorlesung.component.css'],
  encapsulation: ViewEncapsulation.None // from https://coryrylan.com/blog/css-encapsulation-with-angular-components
})
export class WeihnachtsvorlesungComponent implements OnInit {
  // serverHostName: string = 'http://koffer.lan';
  // serverHostName: string = 'http://belinda.cgv.tugraz.at'
  serverHostName = 'raspigas.lan';
  serverPort = '9090';
  serverPath = 'api/v1/';
  // queryString: string = 'mic_audiolevel';
  // queryString: string = 'co2{location="FuzzyLab",sensor="scd30"}'
  queryString = 'adc1_c1';
  dataBaseQueryStepMS = 1000;
  timeRange = 60; // 1 min
  runningAvgSeconds = 0;
  fetchFromServerIntervalMS = 1000;
  dataSeriesNames = ['miclvl'];
  changeTrigger = true;

  multiplicateFactors = [ 100 ];

  // end2 = '2018-12-03 15:00';
  end2 = 'now';
  start2 = '2018-12-07 08:00';
  extraDyGraphConfig2 = {
    dateWindow: [
      new Date('2018-12-07 08:00'), // earliest
      new Date('2018-12-07 16:00') // latest
    ]
    // dyShading (from = Date().getTime()- (.2*60*60*1000), to = Date().getTime()- (1.4*60*60*1000))
  };
  annotations1 = [];
  annotations2 = [];

  constructor(private localStorage: LocalStorageService) {}
  ngOnChanges(changes: SimpleChanges) {
    console.log('app: ngOnC triggered')
  }
  changeTriggered(invar: number) {
    console.log(invar);
    this.changeTrigger = ! this.changeTrigger;
  }
  ngOnInit() {

    // push // Annotations for short term graph
    this.annotations1.push({
      series: 'miclvl',
      x: new Date().getTime(),
      shortText: 'E6',
      text: 'Experiment 6',
      cssClass: 'utAnnotation',
      tickColor: 'rgb(148, 231, 255)',
      tickWidth: '2',
      tickHeight: '70',
      dBValue: 81
    });
    this.annotations1.push({
      series: 'miclvl',
      x: new Date().getTime()- (.2*60*60*1000),       // calculate annotation time 0.2mins from now
      shortText: 'E5',
      text: 'Experiment 5'
    });

    // Annotations for long term graph
    this.annotations2.push({
      series: 'miclvl',
      x: new Date().getTime(),
      cssClass: 'utAnnotation',
      tickColor: 'rgb(148, 231, 255)',
      tickWidth: '2',
      tickHeight: '70',
      shortText: 'E6',
      text: 'Experiment 6',
      dBValue: 61
    });
    this.annotations2.push({
      series: 'miclvl',
      x: new Date().getTime()- (1.4*60*60*1000),
      shortText: 'E1',
      text: 'Experiment 1',
      dBValue: 51
    });
    this.annotations2.push({
      series: 'miclvl',
      x: new Date().getTime()- (1.2*60*60*1000),
      shortText: 'E2',
      text: 'Experiment 2',
      dBValue: 52
    });
    this.annotations2.push({
      series: 'miclvl',
      x: new Date().getTime()- (1*60*60*1000),
      shortText: 'E3',
      text: 'Experiment 3',
      dBValue: 53
    });
    this.annotations2.push({
      series: 'miclvl',
      x: new Date().getTime()- (.7*60*60*1000),
      shortText: 'E4',
      text: 'Experiment 4',
      dBValue: 54
    });
    this.annotations2.push({
      series: 'miclvl',
      x: new Date().getTime()- (.2*60*60*1000),
      shortText: 'E5',
      text: 'Experiment 5',
      dBValue: 55
    });
  }

  annotationObject = {
    start: Date,
    end: Date,
    name: "Versuchsname",
    nummer: 1,
    dBvalue: 100 // is the accumulated value from start to end, autocalculated
  }
}
