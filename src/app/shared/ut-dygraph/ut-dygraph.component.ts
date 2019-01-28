import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
  OnDestroy
} from '@angular/core';

import Dygraph from 'dygraphs';
import { interval, Subscription } from 'rxjs';

import { HelperFunctionsService } from '../../core/helper-functions.service';
import { LocalStorageService } from '../../core/local-storage.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';
import { ValueSansProvider } from '@angular/core/src/di/provider';
import { shiftInitState } from '@angular/core/src/view';

@Component({
  selector: 'app-ut-dygraph',
  templateUrl: './ut-dygraph.component.html',
  styleUrls: ['./ut-dygraph.component.scss'],
  encapsulation: ViewEncapsulation.None // from https://coryrylan.com/blog/css-encapsulation-with-angular-components
})
export class UtDygraphComponent implements OnInit, OnDestroy {
  // define on start what doesn't change
  @Input()
  // queryString: string;
  queryString = 'co2{location="FuzzyLab",sensor="scd30"}';

  // set eigher height+width or a position object
  @Input()
  graphHeight: string; // = '350'; // should be any css value
  @Input()
  graphWidth: string; // = '750'; // should be any css value
  @Input()
  style = {
    position: undefined,
    top: undefined,
    bottom: undefined,
    left: undefined,
    right: undefined
  };

  @Input()
  YLabel = 'Value (unit)';
  @Input()
  XLabel = 'Time';
  @Input()
  dataSeriesLabels: Array<string>;
  @Input()
  endTime = 'now';
  @Input()
  startTime = '15m'; // prefix m for min, s for seconds, h for hours, d for days
  @Input()
  dataBaseQueryStepMS = 1000; // query step on server
  @Input()
  fetchFromServerIntervalMS = 1000; // set 0 for no update - but can be changed later - default 1000ms.
  @Input()
  serverHostName: string; // optional, get it from globalSettings instead
  @Input()
  serverPort: string; // optional, get it from globalSettings instead
  @Input()
  serverPath: string; // optional, get it from globalSettings instead
  @Input()
  runningAvgSeconds = 0;
  @Input()
  debug = 'false';
  @Input()
  annotations: Array<any>; // would need definition of Dygraphs Annotation
  @Input()
  extraDyGraphConfig: Object;
  @Input()
  multiplicateFactors = [1];

  @Input()
  calculateRunningAvgFrom: Date;
  @Output()
  returnRunningAvg = new EventEmitter<number>();

  dyGraphOptions = {
    // http://dygraphs.com/options.html
    drawCallback: this.afterDrawCallback, // this.afterZoomCallBack,

    labels: ['Date'], // one element needed for further code.
    title: '',
    animatedZooms: true,
    connectSeparatedPoints: false,
    pointSize: 4,
    hideOverlayOnMouseOut: true,
    legend: <any>'always' // also 'never' possible
  };

  fromZoom: Date;
  toZoom: Date;

  displayedData = [];
  historicalData = [];
  dataBeginTime: Date;
  dataEndTime: Date;
  average: number;

  private overrideDateWindow = [];

  public noData = false;
  public waiting = true;
  public error: string = undefined;

  public running = false;
  public optionsOpen = true;
  public updateOnNewData = true;

  public htmlID: string;
  private requestsUnderway = 0; // don't flood the server if it is not fast enough
  private queryEndPoint: string;

  Dygraph: Dygraph;

  intervalSubscription: Subscription;

  constructor(
    private utFetchdataService: UtFetchdataService,
    private localStorage: LocalStorageService,
    private h: HelperFunctionsService
  ) {}

  constructQueryEndpoint(
    server: string = this.serverHostName,
    port: string = this.serverPort,
    path: string = this.serverPath
  ) {
    return this.utFetchdataService.constructPrometheusEndPoint(
      server,
      port,
      path
    );
  }

  ngOnInit() {
    this.dyGraphOptions['ylabel'] = this.YLabel;
    this.dyGraphOptions['xlabel'] = this.XLabel;
    this.dyGraphOptions.labels.push(...this.dataSeriesLabels);
    if (!this.dyGraphOptions.labels[1]) {
      this.dyGraphOptions.labels[1] = this.queryString;
    }

    this.updateDyGraphOptions();

    if (
      this.dyGraphOptions['dateWindow'] &&
      this.dyGraphOptions['dateWindow'].length
    ) {
      this.overrideDateWindow[0] = this.dyGraphOptions['dateWindow'][0];
      this.overrideDateWindow[1] = this.dyGraphOptions['dateWindow'][1];
    }

    this.displayedData = [[undefined, null]];
    this.htmlID = 'graph_' + (Math.random() + 1).toString();

    console.log(this.endTime);
    const dataEndTime =
      this.endTime === 'now' ? new Date() : new Date(this.endTime);

    const seconds = this.h.parseToSeconds(this.startTime);

    let dataBeginTime;
    if (seconds) {
      dataBeginTime = new Date(dataEndTime.valueOf() - seconds * 1000);
      console.log('length of interval displayed (s): ' + seconds.toString());
    } else {
      dataBeginTime = new Date(this.startTime);
    }

    console.log('dataEndTime ' + (dataEndTime.valueOf() / 1000).toString());

    this.queryEndPoint = this.constructQueryEndpoint();

    this.utFetchdataService
      .getRange(
        this.queryString,
        dataBeginTime,
        dataEndTime,
        this.dataBaseQueryStepMS,
        this.queryEndPoint
      )
      .subscribe(
        (displayedData: Object) => this.handleInitialData(displayedData),
        error => this.handlePrometheusErrors(error)
      );
  }

  ngOnDestroy() {
    this.stopUpdate();
    this.Dygraph.destroy();
    console.log('DyGraph destroyed');
  }

  updateDyGraphOptions() {
    for (const key in this.extraDyGraphConfig) {
      if (this.extraDyGraphConfig.hasOwnProperty(key)) {
        this.dyGraphOptions[key] = this.extraDyGraphConfig[key];
      }
    }
  }

  handlePrometheusErrors(error) {
    console.log(error);
    this.waiting = false;
    if (error['headers']) {
      console.log('headers:');
      console.log(JSON.stringify(error['headers']));
    }
    if (error['message']) {
      console.log(error['message']);
      this.error = error['message'];
    }
    if (error['error']) {
      if (error['error']['target']) {
        console.log(error['error']['target']);
        if (error['error']['target']['__zone_symbol__xhrURL']) {
          this.error +=
            '\n' + error['error']['target']['__zone_symbol__xhrURL'];
        }
      }
      if (error['error']['error']) {
        console.log(
          error['error']['errorType'] + ': ' + error['error']['error']
        );
        if (
          error['error']['error'].search(
            /Try decreasing the query resolution/
          ) > -1
        ) {
          this.error += 'too many points';
          this.stopUpdate();
          return;
        }
      }
    } else {
      this.error = 'unknown error';
    }
  }

  handleInitialData(receivedData: Object) {
    console.log('received Data:');
    console.log(receivedData);

    if (
      !receivedData['data'] ||
      !receivedData['data']['result'] ||
      !receivedData['data']['result'][0] ||
      !receivedData['data']['result'][0]['metric'] ||
      !receivedData['data']['result'][0]['values']
    ) {
      console.log('Error: no valid data received.');
      console.log(receivedData);
      this.noData = true;
      this.waiting = false;
      return;
    }
    const metric = receivedData['data']['result'][0]['metric'];
    const values = receivedData['data']['result'][0]['values'];

    this.displayedData = [];
    let gap = 0;
    for (let i = 0; i < values.length; i++) {
      const element = values[i];

      // insert NaN gap for Dygraphs to not connect lines if point missing
      if (values.length > 1) {
        if (i === 0) {
          gap = values[1][0] - values[0][0];
        } else if (element[0] - values[i - 1][0] > gap) {
          this.displayedData.push([new Date((element[0] + gap) * 1000), NaN]);
        }
      }

      this.displayedData.push([
        new Date(element[0] * 1000),
        Number(element[1]) * this.multiplicateFactors[0]
      ]);
    }

    if (metric['location']) {
      this.dyGraphOptions['labels'][1] = metric['location'];
    }

    if (metric['sensor']) {
      this.dyGraphOptions['labels'][1] += ' ' + metric['sensor'];
    }
    if (!this.dyGraphOptions['labels'][1]) {
      this.dyGraphOptions['labels'][1] = 'undefined';
    }

    this.historicalData = this.displayedData;
    this.average = this.calculateAverage();

    this.updateDateWindow();

    this.waiting = false;
    this.Dygraph = new Dygraph(
      this.htmlID,
      this.displayedData,
      this.dyGraphOptions
    );
    this.Dygraph['parent'] = this;
    if (this.runningAvgSeconds) {
      this.Dygraph.adjustRoll(this.runningAvgSeconds);
    }
    let usedAnnotations = [];
    if (this.annotations) {
      usedAnnotations = this.annotations;
    } else {
      usedAnnotations = this.localStorage.get(
        'annotations.' + this.dyGraphOptions['labels'][1]
      );
    }

    if (usedAnnotations) {
      const from = this.displayedData[0][0];
      const to = new Date();
      const inViewAnnos = this.filterinViewAnnos(usedAnnotations, from, to);
      this.adjustAnnotationsXtoMS(inViewAnnos);
      this.Dygraph.setAnnotations(inViewAnnos);
    }

    console.log(this.dyGraphOptions);
    console.log(this.displayedData);

    if (this.fetchFromServerIntervalMS > 0) {
      this.startUpdate();
    }
  }

  afterZoomCallBack(
    minDate: Date,
    maxDate: Date,
    yRanges?: Array<Array<number>>
  ) {
    console.log('after dygraph zoom');
    console.log([minDate, maxDate, yRanges]);
    this.fromZoom = new Date(minDate);
    this.toZoom = new Date(maxDate);
  }
  afterDrawCallback(g: Dygraph, isOInitial: boolean) {
    console.log('after dygraph draw');
    const xrange = g.xAxisRange();
    console.log(xrange);
    const from = xrange[0];
    const to = xrange[1];
    if (!from || !to) {
      console.error('after Draw error: from/to NaN');
      // g.resetZoom(); //DONT do, infinite loop!
      const dw = g.getOption('dateWindow');
      console.log(dw);
      if (!g.hasOwnProperty('modified')) {
        g['modified'] = 1;
      } else {
        g['modified'] = g['modified'] + 1;
        if (g['modified'] < 10) {
          g.updateOptions({ dateWindow: dw });
        }
      }

      return;
    }

    if (g.hasOwnProperty('parent')) {
      const parent = g['parent'];
      if (
        parent &&
        parent.hasOwnProperty('fromZoom') &&
        parent.hasOwnProperty('toZoom')
      ) {
        parent.fromZoom = new Date(from);
        parent.toZoom = new Date(to);
      }
    } else {
      console.log('no parent');
    }
  }

  startUpdate() {
    // if (1 == 1) return;
    this.intervalSubscription = interval(
      this.fetchFromServerIntervalMS
    ).subscribe(counter => {
      this.fetchNewData();
    });
    this.running = true;
  }
  stopUpdate() {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
    this.running = false;
  }

  startUpdateOnNewData() {
    this.updateOnNewData = true;
  }
  stopUpdateOnNewData() {
    this.updateOnNewData = false;
  }

  calculateAverage(from?: Date, targetArray = this.displayedData) {
    const datalen = targetArray.length;
    if (!datalen) {
      return;
    }
    // console.log('ut-dy.c: calculateAverage');
    // console.log(from);
    let sum = 0,
      upper = 0,
      lower;
    if (from) {
      [lower, upper] = this.binarySearchNearDate(targetArray, from);
      console.log([lower, upper]);
      console.log([
        'avg (',
        (targetArray[datalen - 1][0] - targetArray[upper][0]) / 1000,
        ')s from ',
        targetArray[upper][0],
        ' to ',
        targetArray[datalen - 1][0]
      ]);
    }
    for (let i = upper; i < datalen; i++) {
      sum += targetArray[i][1];
    }
    const avg = sum / (datalen - upper);
    //    console.log([avg, datalen - upper]);
    return avg;
  }

  handleUpdatedData(displayedData: Object) {
    this.requestsUnderway--;
    const dataArray = this.h.getDeep(displayedData, ['data', 'result']);
    if (Array.isArray(dataArray) && dataArray.length === 0) {
      console.log('handleUpdatedData: empty dataset received');
      return;
    }

    if (!this.Dygraph) {
      console.error('Dygraph not there, unsubscribing');
      this.stopUpdate();
      return;
    }

    const values = this.h.getDeep(displayedData, [
      'data',
      'result',
      0,
      'values'
    ]);
    if (!values) {
      console.error('handleUpdatedData: input object wrong');
      console.log(displayedData);
      return;
    }

    // check if there is already newer data from an earlier request
    let iteratedDate: Date;
    let iteratingOnOldData = true;
    let lastDate: number; // mseconds since 1970
    let currentDate: number; // mseconds since 1970
    const newData = [];

    // TODO: check for gaps and insert NaN (see initial handling)
    values.forEach(element => {
      currentDate = element[0] * 1000;

      if (iteratingOnOldData) {
        lastDate = this.displayedData[
          this.displayedData.length - 1
        ][0].valueOf();
        if (lastDate >= currentDate) {
          // console.log('iterating on old number');
          return;
        } else {
          iteratingOnOldData = false;
        }
      }

      iteratedDate = new Date(currentDate);
      newData.push([
        iteratedDate,
        Number(element[1]) * this.multiplicateFactors[0]
      ]);
    });

    // console.log('got ' + values.length + ' elements');
    // console.log('new ' + newData.length + ' elements');

    // trigger ngOnChanges
    this.historicalData = this.historicalData.concat(newData);
    const dataLength = this.displayedData.length;
    // console.log('current length: ' + dataLength + ' elements');
    this.displayedData = this.displayedData.concat(newData);

    // disabled, we're working with dateWindow now!
    // this.displayedData = this.displayedData.slice(
    //   -dataLength,
    //   this.displayedData.length
    // );

    // console.log('new length: ' + this.displayedData.length + ' elements');

    if (this.runningAvgSeconds) {
      this.Dygraph.adjustRoll(this.runningAvgSeconds);
    }

    if (this.updateOnNewData) {
      this.updateDateWindow();
      this.Dygraph.updateOptions(
        {
          dateWindow: this.dyGraphOptions['dateWindow']
        },
        true
      );
    }

    // console.log(      'historical length: ' + this.historicalData.length + ' elements'    );
    // console.log(this.annotations)
    let usedAnnotations = [];
    if (this.annotations) {
      usedAnnotations = this.annotations;
    } else {
      usedAnnotations = this.localStorage.get(
        'annotations.' + this.dyGraphOptions['labels'][1]
      );
    }

    if (usedAnnotations) {
      const from = this.displayedData[0][0];
      const to = new Date();
      const inViewAnnos = this.filterinViewAnnos(usedAnnotations, from, to);
      this.adjustAnnotationsXtoMS(inViewAnnos);
      this.Dygraph.setAnnotations(inViewAnnos, true);
    }
    if (this.debug === 'true') {
      this.average = this.calculateAverage();
    }
    if (this.calculateRunningAvgFrom) {
      const avg = this.calculateAverage(
        this.calculateRunningAvgFrom,
        this.historicalData
      );
      this.returnRunningAvg.emit(avg);
    }

    this.Dygraph.updateOptions({ file: this.displayedData }, false); // redraw only once at the end
  }

  updateDateWindow() {
    if (this.overrideDateWindow.length) {
      if (this.dyGraphOptions['dateWindowEnd']) {
        const extension =
          this.h.parseToSeconds(this.dyGraphOptions['dateWindowEnd']) * 1000;
        const now = new Date();
        const extendedEnd = new Date(now.valueOf() + extension);
        if (
          this.dyGraphOptions['dateWindow'][1].valueOf() < extendedEnd.valueOf()
        ) {
          this.dyGraphOptions['dateWindow'][1] = extendedEnd;
        }
      }
    } else {
      const dataEndTime =
        this.endTime === 'now' ? new Date() : new Date(this.endTime);

      const seconds = this.h.parseToSeconds(this.startTime);
      let dataBeginTime;
      if (seconds) {
        dataBeginTime = new Date(dataEndTime.valueOf() - seconds * 1000);
        console.log('length of interval displayed (s): ' + seconds.toString());
      } else {
        dataBeginTime = new Date(this.startTime);
      }
      this.dyGraphOptions['dateWindow'] = [dataBeginTime, dataEndTime];
      this.fromZoom = dataBeginTime;
      this.toZoom = dataEndTime;
    }
  }

  fetchNewData() {
    // console.log(this.requestsUnderway);
    if (this.requestsUnderway > 0) {
      console.log('not sending displayedData request, one on the way already');
      return;
    }
    if (this.requestsUnderway > 2) {
      console.error('5 requests on the way, none returned, check server conn.');
      return;
    }
    this.requestsUnderway++;

    const startDate = this.displayedData[this.displayedData.length - 1][0];
    if (!startDate) {
      // unsure if needed, because now interval is only triggered when initial data here.
      console.log(startDate);
      console.error('error in fetchNewData: no previous data found');
      this.requestsUnderway--;
      return;
    }
    this.utFetchdataService
      .getRange(
        this.queryString,
        startDate,
        new Date(),
        this.dataBaseQueryStepMS,
        this.queryEndPoint
      )
      .subscribe((displayedData: Object) =>
        this.handleUpdatedData(displayedData)
      );
  }

  adjustAnnotationsXtoMS(annotations) {
    annotations.forEach(annotation => {
      if (null === annotation['x'] || true === annotation['adjusted']) {
        return;
      }

      // console.log('old annotation: ' + annotation['x']);
      const [lower, upper] = this.binarySearchNearDate(
        this.displayedData,
        annotation['x']
      );
      if (!lower || !upper) {
        console.log(
          'no valid x value for ' + annotation['shortText'] + annotation['text']
        );
        // annotation['adjusted'] = true; // FIXME tmp to not load the cpu too high
        return;
      }
      annotation['x'] = this.displayedData[lower][0].valueOf();
      // console.log('lower: ' + annotation['x']);
      // console.log('upper: ' + this.displayedData[upper][0].valueOf());
      // annotation['adjusted'] = true;
    });
    return annotations;
  }

  filterinViewAnnos(annotations: Array<Object>, from: Date, to: Date) {
    const returnedAnnos = [];
    annotations.forEach(annotation => {
      const annoDateMS = annotation['x'];
      if (!annoDateMS) {
        return;
      }
      if (annoDateMS >= from.valueOf() && annoDateMS <= to.valueOf()) {
        returnedAnnos.push(annotation);
      }
    });
    return returnedAnnos;
  }

  // array must be consecutive!
  // returns the two indizes in which between the searched Date is
  binarySearchNearDate(
    inputArray: Array<[Date, any]>,
    target: Date,
    ObjectPath?: String
  ) {
    let lowerIndex = 0,
      upperIndex = inputArray.length - 1;

    function compareDate(date1: Date, date2: Date) {
      if (!date1 || !date2) {
        return undefined;
      }
      if (date1.valueOf() === date2.valueOf()) {
        return 0;
      }
      return date1.valueOf() > date2.valueOf() ? 1 : -1;
    }

    while (lowerIndex + 1 < upperIndex) {
      const halfIndex = (lowerIndex + upperIndex) >> 1; // tslint:disable-line
      const halfElem = inputArray[halfIndex][0];

      const comparisonResult = compareDate(target, halfElem);
      if (comparisonResult === undefined) {
        return [undefined, undefined];
      }
      if (comparisonResult === 0) {
        lowerIndex = halfIndex;
        upperIndex = halfIndex;
        break;
      }
      if (comparisonResult > 0) {
        lowerIndex = halfIndex;
      } else {
        upperIndex = halfIndex;
      }
    }

    return [lowerIndex, upperIndex];
  }

  toggleOptions() {
    this.optionsOpen = !this.optionsOpen;
  }
  toggleFetching() {
    if (this.running) {
      this.stopUpdate();
      this.running = false;
    } else {
      this.startUpdate();
      this.running = true;
    }
  }
  toggleAutoPan() {
    if (this.updateOnNewData) {
      this.stopUpdateOnNewData();
      this.updateOnNewData = false;
    } else {
      this.startUpdateOnNewData();
      this.updateOnNewData = true;
    }
  }
}
