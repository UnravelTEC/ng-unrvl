import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import Dygraph from 'dygraphs';
import { interval, Subscription } from 'rxjs';
import { HelperFunctionsService } from '../../core/helper-functions.service';
import { LocalStorageService } from '../../core/local-storage.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

import cloneDeep from 'lodash-es/cloneDeep';

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
    drawCallback: this.afterDrawCallback,
    zoomCallback: this.afterZoomCallback,
    panEdgeFraction: 0.1,

    labels: ['Date'], // one element needed for further code.
    title: '',
    animatedZooms: true,
    connectSeparatedPoints: false,
    pointSize: 4,
    hideOverlayOnMouseOut: true,
    legend: <any>'always' // also 'never' possible
  };

  public fromZoom: Date;
  public toZoom: Date;

  public displayedData = [];
  public lastValue = undefined;
  public lastValues = [];

  public columnLabels = [];

  public dataBeginTime: Date;
  public dataEndTime: Date;
  public average: number;

  public noData = false;
  public waiting = true;
  public error: string = undefined;

  public running = false;
  public optionsOpen = false;
  public updateOnNewData = true;

  public panAmount = 0.5;
  public zoomValue = 5;
  public zoomMultiplicator = 60;

  public htmlID: string;

  private overrideDateWindow = [];
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
    /*this.dyGraphOptions.labels.push(...this.dataSeriesLabels);
    if (!this.dyGraphOptions.labels[1]) {
      this.dyGraphOptions.labels[1] = this.queryString;
    }*/

    this.updateDyGraphOptions();

    if (
      this.dyGraphOptions['dateWindow'] &&
      this.dyGraphOptions['dateWindow'].length
    ) {
      this.overrideDateWindow[0] = this.dyGraphOptions['dateWindow'][0];
      this.overrideDateWindow[1] = this.dyGraphOptions['dateWindow'][1];
    }

    // this.displayedData = [[undefined, null]];
    this.htmlID = 'graph_' + (Math.random() + 1).toString();

    console.log(this.endTime);

    let dataEndTime: Date;
    let dataBeginTime: Date;

    [dataBeginTime, dataEndTime] = this.calculateTimeRange(
      this.startTime,
      this.endTime
    );

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
    if (this.Dygraph) {
      this.Dygraph.destroy();
      console.log('DyGraph destroyed');
    }
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

  /*
    Prometheus data format:
    {
      data: {
        result: [
          { // series 1
            metric: {
              __name__ : "metricname",
              $keyN: $valueN,
              ...
            },
            values : [
              [
                timestamp0, // number (Seconds since epoch)
                value0 // String
              ],
              [
                timestamp1,
                value1
              ],
              ....
            ]
          },
          { // series 2
            metric: { },
            values: [ [ timestamp, value ], [ t,v ], ... ] // timestamps correspond between series.
          }
        ]
      }
    }
    Dygraphs data format: http://dygraphs.com/data.html
    this.displayedData = [
      [ timestamp0, value01, value02, value03, ...], // timestamp: Date object
      [ timestamp1, value11, value12, value13, ...],
      ...
    ]
    this.dyGraphOptions['labels'] = [
      "Time",
      "labelstring1",
      "labelstring2",
      ...
    ]

    handle any data:
      1. check which columns are there in prometheus data -> concat to a "labelstring"
      1. check which columns are there in this.dyGraphOptions.labels <- this is our index for labelstrings
      -> if missing
        , push to this.dyGraphOptions.labels
        , add NaN to all previous columns of this.displayedData

        there can be holes in any dataset received...

        if receiving several datasets:
          start with "oldest" (has oldest first entry)
              if timestamp < newest we have, delete it
            look with column nr in our labels it is
            receivedDataset = {[]
              labelstring1 : [ ],
              labelstring2 : [ ],
            } =>
            resortedPData [ // in the order of this.displayedData
              "time",
              values0[],
              values1[]
            ]
            create entry [timestamp, undefined, entry, undefined, ...]; array.delete it from source data column


  */

  updateDataSet(pData: Object, debugFun = false): boolean {
    // prometheus data
    debugFun && console.log('updateDataSet');
    debugFun && console.log(pData);

    const result = this.h.getDeep(pData, ['data', 'result']);
    if (!result || !Array.isArray(result)) {
      console.error('updateDataSet: no valid data received.');
      return false;
    }
    const nrResults = result.length;
    debugFun &&
      console.log('updateDataSet: ' + nrResults + ' data series received.');
    if (!nrResults) {
      return false;
    }
    const metric0 = this.h.getDeep(result, [0, 'metric']);
    const values0 = this.h.getDeep(result, [0, 'values']);
    if (!values0 || !metric0) {
      console.error('updateDataSet: no valid data received.');
      return false;
    }

    const receivedDataset = {}; // labelstring : data[] foreach series

    // update labels
    const oldLabels = this.dyGraphOptions['labels']; // content: another array => call by ref
    debugFun && console.log(['old labels:', cloneDeep(oldLabels)]); // deepcopy
    const newLabels = [];
    let dataThere = false;
    for (let seriesNr = 0; seriesNr < nrResults; seriesNr++) {
      const lObj = this.h.getDeep(result, [seriesNr, 'metric']);
      const newLabelString = this.createLabelString(lObj);
      newLabels.push(newLabelString);

      const seriesData = this.h.getDeep(result, [seriesNr, 'values']);
      if (seriesData.length) {
        dataThere = true;
      }
      receivedDataset[newLabelString] = seriesData;
    }
    if (!dataThere) {
      console.log('all data columns received empty');
      return;
    }

    debugFun && console.log('new labels:', cloneDeep(newLabels));

    const resortedPData = []; // in the order of this.displayedData
    resortedPData.push(['Timestamp']); // dummy to have indices the same

    for (let i = 0; i < newLabels.length; i++) {
      const currentNewLabelString = newLabels[i];
      const oldIndex = oldLabels.indexOf(currentNewLabelString);
      if (oldIndex === -1) {
        // update old data with up to now with NaN
        this.displayedData.forEach(element => {
          element.push(NaN);
        });
        resortedPData[oldLabels.length] =
          receivedDataset[currentNewLabelString];
        oldLabels.push(currentNewLabelString);
        this.columnLabels[oldLabels.length - 2] = this.h.getDeep(result, [
          i,
          'metric'
        ]);
        console.log('columnlabels now:', cloneDeep(this.columnLabels));
        debugFun && console.log(['added new label, result:', oldLabels]);
      } else {
        resortedPData[oldIndex] = receivedDataset[currentNewLabelString];
      }
      // Note: it may be the case that resortedPData has empty indices!!
    }
    debugFun && console.log('old labels after:', cloneDeep(oldLabels));
    debugFun && console.log(['resortedPData:', resortedPData, oldLabels]); // should be resorted to indices like in oldLabels

    // go through resortedPData[][], shift firsts...
    let deadManCounter = 0;
    let validRows = 0;
    while (true) {
      debugFun &&
        console.log([
          'while',
          deadManCounter,
          resortedPData,
          this.displayedData
        ]);
      deadManCounter++;

      let lastTime;
      if (
        this.displayedData.length &&
        this.displayedData[this.displayedData.length - 1] &&
        this.displayedData[this.displayedData.length - 1][0]
      ) {
        lastTime = this.displayedData[
          this.displayedData.length - 1
        ][0].valueOf();
      } else {
        lastTime = 0;
      }

      debugFun && console.log('lastTime:', lastTime);

      // look up "oldest" timestamp in this row - and take it as base for this row
      let oldestTime = new Date().valueOf();
      let stillWorking = false;
      for (let i = 1; i < oldLabels.length; i++) {
        // 1 to start not on timestamp column
        const column = resortedPData[i];
        if (!column || column.length === 0) {
          debugFun && console.log('oldestsearch: column empty');
          continue;
        } else {
          stillWorking = true;
        }
        const element = column[0];
        const elementsTime = element[0] * 1000;
        if (elementsTime < oldestTime) {
          oldestTime = elementsTime;
        }
      }
      debugFun && console.log('oldestTime', oldestTime);
      if (deadManCounter > 11000) {
        stillWorking = false;
      }
      if (stillWorking === false) {
        debugFun &&
          console.log('updateDataSet: done, added', validRows, 'rows.');
        break;
      }

      // Gap detection
      if (
        lastTime &&
        lastTime + Number(this.dataBaseQueryStepMS) * 1.1 < oldestTime
      ) {
        const gapRow = [];
        gapRow.push(new Date(lastTime + Number(this.dataBaseQueryStepMS)));
        debugFun && console.log('gapRow:', gapRow);
        for (let i = 1; i < oldLabels.length; i++) {
          gapRow.push(NaN);
        }
        this.displayedData.push(gapRow);
      }

      // for every entry in this row that matches the timestamp, take it
      let newRow = [];
      let rowValid = false;
      newRow.push(new Date(oldestTime));
      for (let i = 1; i < oldLabels.length; i++) {
        const column = resortedPData[i];
        if (!column || !column[0]) {
          newRow[i] = NaN; // not to leave any empty
          continue;
        }

        const elementsTime = column[0][0] * 1000;
        if (elementsTime <= lastTime) {
          column.shift(); // we already have it, drop it
          newRow[i] = NaN; // not to leave any empty
          debugFun &&
            console.log([
              'drop',
              oldLabels[i],
              'on',
              new Date(elementsTime),
              'before',
              new Date(lastTime)
            ]);
          continue;
        }
        if (elementsTime === oldestTime) {
          // what we want
          const element = column.shift();
          if (this.multiplicateFactors[i - 1]) {
            newRow[i] = Number(element[1]) * this.multiplicateFactors[i - 1];
          } else {
            newRow[i] = Number(element[1]);
          }
          rowValid = true;
          continue;
        }
        if (elementsTime > oldestTime) {
          debugFun &&
            console.log([
              'column',
              oldLabels[i],
              'date',
              new Date(elementsTime),
              'behind',
              new Date(oldestTime)
            ]);
          newRow[i] = NaN;
        }
      }

      if (rowValid) {
        debugFun && console.log(['new row ready:', newRow]);
        this.displayedData.push(newRow);
        validRows++;
      } else {
        debugFun && console.log('row invalid');
      }
    }

    if (
      this.displayedData.length &&
      this.displayedData[this.displayedData.length - 1]
    ) {
      const nrCols = this.displayedData.length - 1;
      let avg = 0;
      let last = this.displayedData[nrCols];
      for (let i = 1; i < oldLabels.length; i++) {
        debugFun && console.log('4avg:', last[i]);
        avg += last[i];
      }
      this.lastValue = avg / (oldLabels.length - 1);
      this.lastValues = last;
    }

    return true;
  }

  createLabelString(lObj: Object): string {
    let labelString = '';
    let firstDone = false;
    for (var key in lObj) {
      if (key === '__name__') {
        continue;
      }
      const value = lObj[key];
      if (firstDone) {
        labelString += ', ';
      } else {
        firstDone = true;
      }
      labelString += key + ': ' + value;
    }
    return labelString;
  }

  handleInitialData(receivedData: Object) {
    console.log('handleInitialData: received Data:');
    console.log(receivedData);

    this.updateDataSet(receivedData); //TMP for testing

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
    // f (1 === 1) return;
    if (this.fetchFromServerIntervalMS > 0) {
      this.startUpdate();
    }
  }

  afterZoomCallback(
    minDate: number,
    maxDate: number,
    yRanges?: Array<Array<number>>
  ) {
    const debugFun = false;
    debugFun && console.log('after dygraph zoom callback');
    debugFun && console.log([typeof minDate, minDate, maxDate, yRanges]);

    if (this.hasOwnProperty('parent')) {
      const parent = this['parent'];
      // parent.fromZoom = new Date(minDate);
      // parent.toZoom = new Date(maxDate);
    } else {
      debugFun && console.log('afterZoom: No parent');
    }
  }
  afterDrawCallback(g: Dygraph, isOInitial: boolean) {
    const debugFun = false;
    debugFun && console.log('after dygraph draw callback');

    if (!g.hasOwnProperty('parent')) {
      console.error('afterDrawCallback: no parent');
      return;
    }

    const xrange = g.xAxisRange();
    const dw = g.getOption('dateWindow');
    const from = xrange[0];
    const to = xrange[1];
    debugFun && console.log(['xr:', from, to, 'dw:', dw[0], dw[1]]);
    if (!from || !to) {
      console.error('after Draw error: from/to NaN');
      // g.resetZoom(); //DONT do, infinite loop!

      if (dw[0] === dw[1]) {
        console.error('dateWindow the same');
      }
      debugFun && console.log(dw);
      if (!g.hasOwnProperty('modified')) {
        g['modified'] = 1;
      } else {
        g['modified'] = g['modified'] + 1;
        if (g['modified'] < 10) {
          g.updateOptions({ dateWindow: dw });
          debugFun && console.log('reset dateWindow');
        }
      }

      return;
    }

    const parent = g['parent'];
    if (
      parent &&
      parent.hasOwnProperty('fromZoom') &&
      parent.hasOwnProperty('toZoom')
    ) {
      parent.fromZoom = new Date(from);
      parent.toZoom = new Date(to);
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

    this.updateDataSet(displayedData);

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
        this.displayedData
      );
      this.returnRunningAvg.emit(avg);
    }

    this.Dygraph.updateOptions({ file: this.displayedData }, false); // redraw only once at the end
  }

  updateDateWindow() {
    const debugFun = false;
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
        debugFun &&
          console.log(
            'length of interval displayed (s): ' + seconds.toString()
          );
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
    } else {
      this.startUpdateOnNewData();
    }
  }
  pan(direction: string) {
    this.stopUpdateOnNewData();
    const dw = this.Dygraph.getOption('dateWindow');
    const currentTimeRangeSeconds = dw[1].valueOf() - dw[0].valueOf();
    const panFor = currentTimeRangeSeconds * this.panAmount;
    console.log([direction, this.panAmount, panFor]);
    if (direction === 'forward') {
      dw[0] = new Date(dw[0].valueOf() + panFor);
      dw[1] = new Date(dw[1].valueOf() + panFor);
    }
    if (direction === 'back') {
      dw[0] = new Date(dw[0].valueOf() - panFor);
      dw[1] = new Date(dw[1].valueOf() - panFor);
    }
    this.Dygraph.updateOptions({ dateWindow: dw });
  }
  resetZoom() {
    let newDateWindow = [];
    if (this.overrideDateWindow && this.overrideDateWindow.length) {
      this.Dygraph.updateOptions({ dateWindow: this.overrideDateWindow });
      console.log('resetZoom: took dateWindow from override');
      return;
    }
    let dataEndTime: Date;
    let dataBeginTime: Date;
    [dataBeginTime, dataEndTime] = this.calculateTimeRange(
      this.startTime,
      this.endTime
    );

    this.Dygraph.updateOptions({
      dateWindow: [dataBeginTime.valueOf(), dataEndTime.valueOf()]
    });
    console.log([
      'resetZoom:',
      dataBeginTime,
      dataEndTime,
      this.startTime,
      this.endTime
    ]);
  }
  fullZoom() {
    this.Dygraph.resetZoom();
  }

  calculateTimeRange(startTime: string, endTime: string): [Date, Date] {
    let startDate: Date;
    let endDate: Date;

    endDate = endTime === 'now' ? new Date() : new Date(endTime);

    const seconds = this.h.parseToSeconds(startTime);

    if (seconds) {
      startDate = new Date(endDate.valueOf() - seconds * 1000);
      // console.log('length of interval displayed (s): ' + seconds.toString());
    } else {
      startDate = new Date(startTime);
    }

    return [startDate, endDate];
  }

  changeRange(param) {
    console.log(['changeRange', param]);
    let startDate: Date;
    let endDate: Date;

    endDate = this.endTime === 'now' ? new Date() : new Date(this.endTime);

    const seconds = this.zoomValue * this.zoomMultiplicator;
    startDate = new Date(endDate.valueOf() - seconds * 1000);

    this.Dygraph.updateOptions({
      dateWindow: [startDate.valueOf(), endDate.valueOf()]
    });
  }
}
