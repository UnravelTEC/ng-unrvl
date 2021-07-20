import { FormControl } from '@angular/forms';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
  SimpleChanges,
  OnChanges,
} from '@angular/core';

import Dygraph from 'dygraphs';

import cloneDeep from 'lodash-es/cloneDeep';

import { HelperFunctionsService } from '../../core/helper-functions.service';
import { LocalStorageService } from '../../core/local-storage.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

@Component({
  selector: 'app-ut-dygraph-in',
  templateUrl: './ut-dygraph-in.component.html',
  styleUrls: ['./ut-dygraph-in.component.scss'],
  encapsulation: ViewEncapsulation.None, // from https://coryrylan.com/blog/css-encapsulation-with-angular-components
})
export class UtDygraphInComponent implements OnInit, OnDestroy, OnChanges {
  // define on start what doesn't change
  @Input()
  // queryString: string;
  queryString = '';

  @Input()
  style = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
  private graphBackGroundColor = '#3F3F3F';
  public yO = '0';
  public y2O = '0';
  @Input()
  startTime = '15m'; // prefix m for min, s for seconds, h for hours, d for days

  private defaultYlabel = 'Value (unit)';
  @Input()
  YLabel = this.defaultYlabel;
  @Input()
  XLabel = undefined;
  @Input()
  runningAvgPoints = 0;
  @Input()
  options = true;
  @Input()
  extraDyGraphConfig: Object;
  @Input()
  minimal = false;
  @Input()
  multiplicateFactors = [1];
  @Input()
  labelBlackList: string[];
  @Input()
  showDate = true;
  @Input()
  showLogscaleSwitcher = true;
  @Input()
  backGroundLevels: Array<[number, string]>;
  @Input()
  colors = [];

  private backGroundLevelExample = [
    // the color acts for "everything below $value"
    [0.01, 'white'], // first one not used
    [400, 'rgba(0, 128, 0, 0.5)'], // green
    [800, 'rgba(255, 255, 0, 0.5)'], // yellow
    [1200, 'rgba(255, 166, 0, 0.5)'], // orange
    [20000, 'rgba(255, 0, 0, 0.5)'], // red
  ];

  @Input()
  calculateRunningAvgFrom: Date;
  @Output()
  returnRunningAvg = new EventEmitter<number>();

  @Input()
  enableHighlightCallback = false;
  @Output()
  returnHighlightedRow = new EventEmitter<number>();

  public yRange = [undefined, undefined];
  public y2Range = [undefined, undefined];

  private gridlineActiveWidth = 1.5;
  private gridlineInactiveWidth = 0.0001;
  private gridlineActiveColor = '#4A4A4A';
  private gridlineInactiveColor = this.graphBackGroundColor;

  dyGraphOptions = {
    // http://dygraphs.com/options.html
    drawCallback: this.afterDrawCallback,
    zoomCallback: this.afterZoomCallback,
    // clickCallback: this.clickCallback,

    // panEdgeFraction: 0.9,

    labels: ['Date'], // one element needed for further code.
    title: '',
    animatedZooms: true,
    connectSeparatedPoints: false,
    highlightSeriesBackgroundAlpha: 1, // disable
    pointSize: 1, // radius
    hideOverlayOnMouseOut: true,
    highlightSeriesOpts: {
      strokeWidth: 3,
      strokeBorderWidth: 1,
      highlightCircleSize: 5,
      strokeBorderColor: this.graphBackGroundColor,
    },
    labelsSeparateLines: true,

    gridLinePattern: [4, 4],
    gridLineWidth: this.gridlineActiveWidth,
    gridLineColor: this.gridlineActiveColor,
    axisLineColor: 'yellow',
    axisLineWidth: 0.001,
    xAxisHeight: 34, // xlabel is 18 high
    // yRangePad: 200, // spacing for data points inside graph
    logscale: true, // must be true, otherwise we cant enable it for y/y2
    axes: {
      y: {
        logscale: false,
        drawGrid: true,
        gridLineWidth: this.gridlineActiveWidth,
        independentTicks: true,
      },
      y2: {
        logscale: false,
        gridLineWidth: this.gridlineInactiveWidth,
        gridLineColor: this.gridlineInactiveColor,
        drawGrid: true,
        independentTicks: true,
      },
    },

    // valueRange: this.yRange,
    legend: <any>'always', // also 'never' possible
    visibility: [],
  };
  private minimalOptions = {
    strokeWidth: 1.5,
    logscale: true,
    legend: 'never',
    drawGrid: false,
    drawAxis: false,
    rightGap: 0,
    highlightSeriesBackgroundAlpha: 1,
    highlightCircleSize: 0,
    highlightSeriesOpts: { strokeBorderWidth: 0, strokeWidth: 1.5 },
  };

  public fromZoom: Date;
  public fromFormDate = new FormControl(new Date());
  public toZoom: Date;
  public toFormDate = new FormControl(new Date());
  public pickerEndDate = new Date();

  @Input()
  public displayedData = [];
  @Input()
  public dataReset = false;
  public lastValue = undefined;
  public lastValues = [];

  @Input()
  public columnLabels = [];
  @Input()
  public changeTrigger = true;

  public dataBeginTime: Date;
  public dataEndTime: Date;
  public currentXrange: number;
  public average: number;
  public visibleAverage: number;
  public averages: number[] = [];
  public visibleAverages: number[] = [];
  public stdDev: number;
  public visibleStdDev: number;
  public stdDevs: number[] = [];
  public visibleStdDevs: number[] = [];
  public min = Infinity;
  public max = -Infinity;

  public noData = false;
  public waiting = true;
  public error: string = undefined;

  public optionsOpen = false;
  public legendContentVisible = true;

  public panAmount = 0.5;
  public zoomValue = 5;
  public zoomMultiplicator = 60;

  public htmlID: string;

  public exportUTC = true;

  private overrideDateWindow = [];

  public graphWidthPx = 0;
  @Output()
  returnGraphWidthOnChange = new EventEmitter<number>();
  @Output()
  returnCurrentZoom = new EventEmitter<number>();

  public stats = false;

  private activeYAxis = 'y1';

  Dygraph: Dygraph;

  constructor(
    private utFetchdataService: UtFetchdataService,
    private localStorage: LocalStorageService,
    private h: HelperFunctionsService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    console.log('onChanges');

    this.updateGraph();
  }
  onWheel(ev) {
    console.log(ev);
    if (ev.deltaY != 0) {
      this.zoom(ev.deltaY > 0 ? 1.25 : 0.66);
    }

    if (ev.deltaX != 0) {
      const oldPan = this.panAmount;
      this.panAmount = 0.05;
      this.pan(ev.deltaX > 0 ? 'forward' : 'back');
      this.panAmount = oldPan;
    }
  }

  getXLabel() {
    const xRangeText = '??';
    // : this.startTime;
    return this.XLabel === undefined
      ? 'Time (&#8202;' + xRangeText + '&#8202;)'
      : this.XLabel;
  }
  returnXrangeText(newXrange) {
    return (
      '<b>Time</b> (&#8202;' + this.h.createHRTimeString(newXrange) + '&#8202;)'
    );
  }
  updateXLabel(update = true) {
    this.dyGraphOptions['xlabel'] = this.getXLabel();
    if (this.Dygraph) {
      this.Dygraph.updateOptions(
        { xlabel: this.dyGraphOptions['xlabel'] },
        !update
      );
    }
  }
  updateGraph() {
    if (this.Dygraph) {
      while (
        this.dyGraphOptions.visibility.length <
        this.columnLabels.length - 1
      ) {
        this.dyGraphOptions.visibility.push(true);
      }

      this.dyGraphOptions['labels'] = this.columnLabels;

      const newDataBeginTime = this.displayedData[0][0];
      const newDataEndTime =
        this.displayedData[this.displayedData.length - 1][0];
      if (
        newDataBeginTime.valueOf() != this.dataBeginTime.valueOf() ||
        newDataEndTime.valueOf() != this.dataEndTime.valueOf()
      ) {
        this.dataReset = true;
      }
      if (this.dataReset) {
        console.log('data reset, restore viewport');
        this.dataBeginTime = newDataBeginTime;
        this.dataEndTime = newDataEndTime;
        this.dyGraphOptions['dateWindow'] = [
          this.dataBeginTime.valueOf(),
          this.dataEndTime.valueOf(),
        ];
        this.dataReset = false;
      }
      if (this.colors && this.colors.length) {
        this.dyGraphOptions['colors'] = this.colors;
        this.Dygraph.updateOptions(
          { colors: this.dyGraphOptions['colors'] },
          true
        );
      }
      this.Dygraph.updateOptions({
        file: this.displayedData,
        labels: this.columnLabels,
        axes: this.dyGraphOptions.axes,
        visibility: this.dyGraphOptions.visibility,
        dateWindow: this.dyGraphOptions['dateWindow'],
      });

      if (this.minimal && this.displayedData.length > 10) {
        const dateOfSecondPt = this.displayedData[1][0].valueOf();
        const fromZoom = this.Dygraph.xAxisRange()[0];
        if (fromZoom > dateOfSecondPt) {
          console.log('shorten graph');
          this.displayedData.shift();
        }
      }
    }
  }
  waitForData() {
    if (this.displayedData && this.displayedData.length > 1) {
      this.handleInitialData(this.displayedData);
    } else {
      if (this.displayedData.length == 0 && this.columnLabels.length == 1) {
        this.noData = true;
        this.waiting = false;
        return;
      }
      setTimeout(() => {
        this.waitForData();
      }, 200);
    }
  }
  ngOnInit() {
    this.dyGraphOptions['underlayCallback'] = this.backGroundLevels
      ? this.highLightBackgroundLevels
      : this.highlightDefaultBackground;
    if (this.minimal) {
      this.options = false;
      this.showDate = false;
      this.YLabel = '';
      this.XLabel = '';
    } else {
      this.dyGraphOptions['legendFormatter'] = this.legendFormatter;
    }

    if (this.enableHighlightCallback) {
      this.dyGraphOptions['highlightCallback'] = this.highlightCallback;
      this.dyGraphOptions['unhighlightCallback'] = this.unhighlightCallback;
    }
    this.dyGraphOptions['ylabel'] = this.YLabel;
    // this.dyGraphOptions['labels'] = this.columnLabels;

    while (
      this.dyGraphOptions.visibility.length <
      this.columnLabels.length - 1
    ) {
      this.dyGraphOptions.visibility.push(true);
    }
    this.updateXLabel();
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
    if (!document['Dygraphs']) {
      document['Dygraphs'] = [];
    }
    document['Dygraphs'][this.htmlID] = this;
    this.dyGraphOptions['labelsDiv'] = 'L_' + this.htmlID;

    // console.log(this.startTime, this.endTime);

    if (this.startTime) {
      [this.dataBeginTime, this.dataEndTime] = this.calculateTimeRange(
        this.startTime,
        'now',
        true
      );
    }

    this.waitForData();
  }

  ngOnDestroy() {
    if (this.Dygraph) {
      this.Dygraph.destroy();
      console.log('DyGraph destroyed');
    }
    delete document['Dygraphs'][this.htmlID];
  }

  updateDyGraphOptions() {
    if (this.minimal) {
      for (const key in this.minimalOptions) {
        if (this.minimalOptions.hasOwnProperty(key)) {
          this.dyGraphOptions[key] = this.minimalOptions[key];
        }
      }
    }

    // console.log('old:', cloneDeep(this.dyGraphOptions));
    // console.log('with:', cloneDeep(this.extraDyGraphConfig));
    this.h.deepCopyInto(this.dyGraphOptions, this.extraDyGraphConfig);
    // console.log('result', cloneDeep(this.dyGraphOptions));

    this.dyGraphOptions.logscale =
      this.dyGraphOptions.axes.y.logscale ||
      this.dyGraphOptions.axes.y2.logscale;

    const yOffset = this.h.getDeep(this.dyGraphOptions, [
      'axes',
      'y',
      'axisLabelWidth',
    ]);
    if (yOffset) {
      this.yO = String(yOffset - 50);
      console.log('yOffset:', this.yO);
    }
    const y2Offset = this.h.getDeep(this.dyGraphOptions, [
      'axes',
      'y2',
      'axisLabelWidth',
    ]);
    if (y2Offset) {
      this.y2O = String(y2Offset - 50);
      console.log('y2Offset:', this.y2O);
    }
  }

  updateLastValueMembers(dataset) {
    if (
      Array.isArray(dataset) &&
      dataset.length &&
      dataset[dataset.length - 1]
    ) {
      const lastrow = dataset[dataset.length - 1];
      // if (this.queryString.startsWith("particulate_matter_ugpm3")) {
      //   console.log("last", lastrow);
      // }

      for (let i = 0; i < lastrow.length; i++) {
        const element = lastrow[i];
        if (element !== undefined && !isNaN(element)) {
          this.lastValues[i] = element;
          // if (this.queryString.startsWith("particulate_matter_ugpm3")) {
          //   console.log(i, lastrow[i]);
          // }
        }
        if (this.lastValues[i] === undefined || isNaN(this.lastValues[i])) {
          for (let row = dataset.length - 1; row >= 0; row--) {
            const lastval = dataset[row][i];
            if (!isNaN(lastval)) {
              this.lastValues[i] = lastval;
              break;
            }
          }
        }
      }
      this.lastValue = NaN;
      let nrValidElements = 0;
      let sum = 0;
      for (let i = 1; i < lastrow.length; i++) {
        const element = lastrow[i];
        if (isNaN(element) || element === undefined || element === null) {
          continue;
        }
        if (element === Infinity || element === -Infinity) {
          return;
        }

        nrValidElements++;
        sum += element;
      }

      if (nrValidElements) {
        this.lastValue = sum / nrValidElements;
      }
    }
  }
  updateMinMax(newdata) {
    if (newdata > this.max) {
      this.max = newdata;
    }
    if (newdata < this.min) {
      this.min = newdata;
    }
  }
  setYranges() {
    const yranges = this.Dygraph.yAxisRanges();
    this.yRange = yranges[0];
    if (yranges[1] && yranges[1].length) {
      this.y2Range = yranges[1];
    }
  }

  handleInitialData(receivedData: Object) {
    if (!this.displayedData.length) {
      console.error('no data');
      return;
    }
    if (!this.columnLabels || !this.columnLabels.length) {
      console.error('you have to supply correct columnLabels');
      return;
    }
    // console.log('handleInitialData: received Data:', cloneDeep(receivedData));

    this.updateAverages();

    this.updateDateWindow();
    this.dyGraphOptions['xlabel'] = this.returnXrangeText(
      (this.toZoom.valueOf() - this.fromZoom.valueOf()) / 1000
    );

    console.log('startin auto unit label for', this.YLabel);
    if (this.YLabel.search(/\(.*\)$/) == -1) {
      let newYlabel = this.YLabel;
      let units = [];
      for (let i = 1; i < this.columnLabels.length; i++) {
        const serieslabel = this.columnLabels[i];
        const unit = serieslabel.match(/\((.*)\)$/);
        // console.log(unit, serieslabel);

        if (unit && units.indexOf(unit[1]) == -1) {
          units.push(unit[1]);
        }
      }
      newYlabel += ' (' + (units.length ? units.join(', ') : 'unitless') + ')';
      this.dyGraphOptions['ylabel'] = newYlabel;
      // TODO y2label
    }

    this.dyGraphOptions['labels'] = this.columnLabels;
    // console.log('COLORS:', cloneDeep(this.colors), cloneDeep(this.h.colorArray));

    console.log(cloneDeep(this.dyGraphOptions));
    if (this.columnLabels.length != this.displayedData[0].length) {
      console.error(
        'mismatch columnlabels',
        this.columnLabels.length,
        'and datalen',
        this.displayedData[0].length
      );
      return;
    }
    this.dyGraphOptions['colors'] = this.colors.length
      ? this.colors
      : this.h.colorArray;
    if (this.backGroundLevels) {
      this.dyGraphOptions['backGroundLevels'] = this.backGroundLevels; // option we create ourselves to access without Dygraphs.parent in initial draw call
    }
    this.updateDyGraphOptions();

    this.waiting = false;
    while (
      this.dyGraphOptions.visibility.length <
      this.columnLabels.length - 1
    ) {
      this.dyGraphOptions.visibility.push(true);
    }
    console.log(
      'creating Dyg',
      this.htmlID,
      cloneDeep(this.displayedData),
      cloneDeep(this.dyGraphOptions)
    );

    this.Dygraph = new Dygraph(
      this.htmlID,
      this.displayedData,
      this.dyGraphOptions
    );
    this.Dygraph['parent'] = this;
    if (this.runningAvgPoints) {
      this.Dygraph.adjustRoll(this.runningAvgPoints);
    }
    // console.log('handleInitialData: dyoptions', this.dyGraphOptions);
    // console.log('handleInitialData: displayedData', this.displayedData);

    if (this.displayedData.length === 0) {
      console.log('no initial data, do not attempt to update');
      this.noData = true;
      return;
    }

    this.checkAndUpdateGraphWidth();
    this.setYranges();
  }
  updateRoll() {
    this.Dygraph.adjustRoll(this.runningAvgPoints);
  }

  getSeriesAxis(seriesName) {
    const axisVal = this.h.getDeep(this.dyGraphOptions, [
      'series',
      seriesName,
      'axis',
    ]);
    return axisVal ? axisVal : 'y1';
  }
  getAxisElements(dygDiv) {
    let y1axis = undefined,
      y2axis = undefined;
    const children = dygDiv.childNodes;
    for (const key in children) {
      if (y1axis && y2axis) {
        break;
      }
      if (children.hasOwnProperty(key)) {
        const element = children[key];
        if (
          element.firstChild &&
          element.firstChild.firstChild &&
          element.firstChild.firstChild['className']
        ) {
          const destchild = element.firstChild.firstChild;
          const childclass = destchild['className'];
          if (!y1axis && childclass.search('dygraph-ylabel') > -1) {
            y1axis = destchild;
            continue;
          }
          if (!y2axis && childclass.search('dygraph-y2label') > -1) {
            // console.log('found y2');
            y2axis = destchild;
          }
        }
      }
    }
    return [y1axis, y2axis];
  }
  setAxisHighlight(seriesName) {
    const axis = this.getSeriesAxis(seriesName);
    if (axis == this.activeYAxis) {
      return;
    }
    this.activeYAxis = axis;
    // console.log(event, x, row, points);
    const classList = document.getElementById(this.htmlID).classList;
    this.activateGrid(axis);
    if (axis == 'y1') {
      classList.add('y1');
      classList.remove('y2');
    } else {
      classList.add('y2');
      classList.remove('y1');
    }
  }
  activateGrid(grid = 'y1') {
    const yRanges = this.Dygraph.yAxisRanges();
    this.dyGraphOptions.axes.y['valueRange'] = yRanges[0];
    this.dyGraphOptions.axes.y2['valueRange'] = yRanges[1];
    if (grid == 'y1') {
      // this.dyGraphOptions.axes.y['drawGrid'] = true;
      // this.dyGraphOptions.axes.y2['drawGrid'] = false;
      this.dyGraphOptions.axes.y['gridLineWidth'] = this.gridlineActiveWidth; // width doesn't work in chrome
      this.dyGraphOptions.axes.y['gridLineColor'] = this.gridlineActiveColor; // use color for chrome
      this.dyGraphOptions.axes.y2['gridLineWidth'] = this.gridlineInactiveWidth;
      this.dyGraphOptions.axes.y2['gridLineColor'] = this.gridlineInactiveColor;
    } else {
      // this.dyGraphOptions.axes.y['drawGrid'] = false;
      // this.dyGraphOptions.axes.y2['drawGrid'] = true; // note: enabling drawGrid y2 again doesn't work, dunno why - use linewidth
      this.dyGraphOptions.axes.y['gridLineWidth'] = this.gridlineInactiveWidth;
      this.dyGraphOptions.axes.y['gridLineColor'] = this.gridlineInactiveColor;
      this.dyGraphOptions.axes.y2['gridLineWidth'] = this.gridlineActiveWidth;
      this.dyGraphOptions.axes.y2['gridLineColor'] = this.gridlineActiveColor;
    }
    this.Dygraph.updateOptions({ axes: this.dyGraphOptions.axes });
    console.log('new grid:', grid, this.dyGraphOptions.axes);
  }

  highlightCallback(event, x, points, row, seriesName) {
    // note: do not use log scale, dygraph does return only displayed data (no values == 0)
    if (!this.hasOwnProperty('parent')) {
      console.error('highlightCallback: No parent');
      return;
    }
    const parent = this['parent'];

    const values = { points: points, seriesName: seriesName };
    parent.returnHighlightedRow.emit(values);

    if (this['numAxes']() < 2) {
      return;
    }
    parent.setAxisHighlight(seriesName);
  }
  unhighlightCallback(event) {
    this['clearSelection']();
    if (this['numAxes']() < 2 || !this['parent']) {
      return;
    }
    // console.log('unhighlight');
    // console.log(event);
    const classList = document.getElementById(this['parent'].htmlID).classList;
    classList.remove('y1');
    classList.remove('y2');

    // const DygDiv = document.getElementById(this['parent'].htmlID).firstChild;
    // const children = DygDiv.childNodes;
    // ['dygraph-ylabel', 'dygraph-y2label'].forEach(cssclass => {
    //   for (const key in children) {
    //     if (
    //       children.hasOwnProperty(key) &&
    //       children[key].firstChild &&
    //       children[key].firstChild.firstChild &&
    //       children[key].firstChild.firstChild['className'] &&
    //       children[key].firstChild.firstChild['className'].search(cssclass) > -1
    //     ) {
    //       children[key].firstChild.firstChild['style'].textShadow = 'none';
    //       children[key].firstChild.firstChild['style'].opacity = 1;
    //       break;
    //     }
    //   }
    // });
  }
  toggleLegendContent(id = '') {
    this.legendContentVisible = !this.legendContentVisible;
    if (id) {
      const classList = document.getElementById('L_' + id).classList;
      if (classList.contains('cthide')) {
        classList.remove('cthide');
      } else {
        classList.add('cthide');
      }
    }
  }
  legendFormatter(data) {
    // let html = '<table>';
    // html += '<tr><th colspan="3" class="header">' + (data.xHTML ? data.xHTML + ':' : 'Legend:') + '</th></tr>';
    const htmlID = this['parent'] ? this['parent']['htmlID'] : '';
    const toggleScript = htmlID
      ? `onclick="document['Dygraphs']['${htmlID}'].toggleLegendContent('${htmlID}')"`
      : '';
    let html =
      '<div class="header">Legend: ' +
      (data.xHTML ? ' values @ ' + data.xHTML : '') +
      `</div><div class="legendToggle" ${toggleScript} title="click to toggle legend">&nbsp;</div>`;
    html += '<table>';

    // console.log(htmlID);
    function genToggle(label, htmlID) {
      return htmlID
        ? `onmousedown="document['Dygraphs']['${htmlID}'].tVis4Label('${label}');" `
        : '';
    }
    function genHover(label, htmlID) {
      return htmlID
        ? `onmouseover="document['Dygraphs']['${htmlID}'].selectSeries('${label}');"`
        : '';
    }
    function genSingleClick(label, htmlID) {
      return htmlID
        ? `onmousedown="document['Dygraphs']['${htmlID}'].showSingle('${label}');" `
        : '';
    }

    for (let i = 0; i < data.series.length; i++) {
      const series = data.series[i];
      const displayedValue = !series.hasOwnProperty('yHTML')
        ? ''
        : series.yHTML;
      const spanvis =
        data.x == null || !series.hasOwnProperty('yHTML')
          ? "style='visibility:hidden'"
          : '';
      const cls = series.isHighlighted ? 'class="highlight"' : '';
      const hoverCallback = genHover(series.label, htmlID);
      const toggleCallback = genToggle(series.label, htmlID);
      const setSingleCallback = genSingleClick(series.label, htmlID);
      const textcolor = series.isVisible ? '' : ' style="color:gray" ';
      html +=
        `<tr style='color:${series.color};' ${cls} ${hoverCallback} title='Toggle Display'>` +
        `<th ${textcolor}><span class='dash'>${series.dashHTML}</span><span class='one' ${setSingleCallback} title='Display alone'>[1]</span></th>` +
        `<th${textcolor} ${toggleCallback}>${series.labelHTML}<span ${spanvis}>:</span>&thinsp;</th>` +
        `<td ${toggleCallback}>${displayedValue}</td></tr>`;
    }
    return html + '</table>';
  }
  selectSeries(name: string) {
    // this.Dygraph.clearSelection();
    this.Dygraph.setSelection(false, name);
    if (this.Dygraph.numAxes() < 2) {
      return;
    }
    this.setAxisHighlight(name);
  }

  // gets called after AfterDrawCallback
  afterZoomCallback(
    minDate: number,
    maxDate: number,
    yRanges?: Array<Array<number>>
  ) {
    const debugflag = true;
    if (debugflag) {
      console.log('after dygraph zoom callback');
      console.log(typeof minDate, minDate, maxDate, yRanges);
      return;
    }

    if (this.hasOwnProperty('parent')) {
      const parent = this['parent'];
      console.log(yRanges[0]);

      console.log(
        'change in XRange',
        Math.floor(minDate),
        parent.fromZoom.valueOf(),
        Math.floor(maxDate),
        parent.toZoom.valueOf()
      );
      if (
        Math.floor(minDate) != parent.fromZoom.valueOf() ||
        Math.floor(maxDate) != parent.toZoom.valueOf()
      ) {
        console.log('change');
      }
    } else {
      console.error('afterZoom: No parent');
    }
  }

  debugFun(logstring: any, enabled = true) {
    if (enabled) {
      const clonetext = cloneDeep(logstring);
      console.log(clonetext);
    }
  }
  checkAndUpdateGraphWidth() {
    const area = this.Dygraph.getArea();
    const graphWidthPx = area.w;
    if (this.graphWidthPx !== graphWidthPx) {
      this.graphWidthPx = graphWidthPx;
      console.log('new graph width:', graphWidthPx);
      this.returnGraphWidthOnChange.emit(graphWidthPx);
    }
  }

  afterDrawCallback(g: Dygraph, isOInitial: boolean) {
    const debugflag = true;
    if (isOInitial) {
      console.log('ignoring initial afterDrawCallback');
      return;
    }
    if (debugflag) {
      console.log('after dygraph draw callback');
    }
    if (!g.hasOwnProperty('parent')) {
      console.error('afterDrawCallback: no parent');
      return;
    }
    const parent = g['parent'];
    if (!parent['displayedData'].length) {
      console.log('afterDrawCallback: no data');
      return;
    }

    const yranges = g.yAxisRanges();
    parent.yRange = yranges[0];
    if (yranges[1] && yranges[1].length) {
      parent.y2Range = yranges[1];
    }

    const [from, to] = g.xAxisRange();
    parent.fromZoom = new Date(from);
    parent.toZoom = new Date(to);
    parent.updateFromToPickers();

    const newXrange = (to - from) / 1000;
    if (newXrange != parent.currentXrange) {
      parent.currentXrange = newXrange;

      this['updateOptions']({ xlabel: parent.returnXrangeText(newXrange) });
    }

    if (debugflag) {
      const dw = g.getOption('dateWindow');
      console.log('xr:', from, to, 'dw:', dw[0], dw[1]);
    }

    parent.returnCurrentZoom.emit([from, to]);
    parent.checkAndUpdateGraphWidth();

    if (parent.optionsOpen) {
      parent.updateAverages();
    }
  }
  updateFromToPickers() {
    if (this.minimal) {
      return;
    }
    this.fromFormDate = new FormControl(this.fromZoom);
    this.toFormDate = new FormControl(this.toZoom);
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
      [lower, upper] = this.h.binarySearchNearDate(targetArray, from);
      console.log([lower, upper]);
      console.log([
        'avg (',
        (targetArray[datalen - 1][0] - targetArray[upper][0]) / 1000,
        ')s from ',
        targetArray[upper][0],
        ' to ',
        targetArray[datalen - 1][0],
      ]);
    }
    const nr_series = targetArray[0].length;
    for (let series_i = 1; series_i <= nr_series - 1; series_i++) {
      sum = 0;
      let series_count = 0;
      for (let time_i = upper; time_i < datalen; time_i++) {
        const value = targetArray[time_i][series_i];
        if (isNaN(value)) {
          // console.log(i, series_i);
          continue;
        }
        sum += value;
        series_count += 1;
      }
      // console.log(sum);

      this.averages[series_i - 1] = sum / series_count;
    }
    sum = 0;
    for (let i = 0; i < this.averages.length; i++) {
      sum += this.averages[i];
    }

    const avg = sum / this.averages.length;
    //    console.log([avg, datalen - upper]);
    return avg;
  }

  updateAverages() {
    // FIXME is very inefficient, as it calculates it new every time - implment sort of running calculation
    const data = this.displayedData;
    const datalen = data.length;
    if (!datalen) {
      console.log('updateAverages: datalen 0');
      return;
    }
    const nr_series = data[0].length;
    const visibleFrom = this.fromZoom ? this.fromZoom.valueOf() : 0;
    const visibleTo = this.toZoom ? this.toZoom.valueOf() : Infinity;

    let sum = 0;
    let stdDevSum = 0;
    let visibleStdDevSum = 0;
    let allValueCount = 0;
    let allVisibleValueCount = 0;
    for (let series_i = 1; series_i <= nr_series - 1; series_i++) {
      sum = 0;
      let visibleSum = 0;
      let series_count = 0;
      let visibleCount = 0;
      for (let time_i = 0; time_i < datalen; time_i++) {
        const value = data[time_i][series_i];
        if (isNaN(value) || value === null) {
          // console.log(i, series_i);
          continue;
        }
        sum += value;
        series_count += 1;
        let timestamp = data[time_i][0];
        if (timestamp >= visibleFrom && timestamp <= visibleTo) {
          visibleSum += value;
          visibleCount += 1;
        }
      }
      // console.log(sum);

      let mean = sum / series_count;
      this.averages[series_i - 1] = mean;
      let visibleMean = visibleSum / visibleCount;
      this.visibleAverages[series_i - 1] = visibleMean;

      // and now, the std dev.
      allValueCount += series_count;
      allVisibleValueCount += visibleCount;
      let seriesStdDevSum = 0;
      let visibleSeriesStdDevSum = 0;

      for (let time_i = 0; time_i < datalen; time_i++) {
        const value = data[time_i][series_i];
        if (isNaN(value) || value === null) {
          // TODO check if === null affects result
          continue;
        }
        let addedValue = Math.pow(value - mean, 2);
        stdDevSum += addedValue;
        seriesStdDevSum += addedValue;
        let timestamp = data[time_i][0];
        if (timestamp >= visibleFrom && timestamp <= visibleTo) {
          visibleStdDevSum += addedValue;
          visibleSeriesStdDevSum += addedValue;
        }
      }
      this.stdDevs[series_i - 1] = Math.sqrt(seriesStdDevSum / series_count);
      this.visibleStdDevs[series_i - 1] = Math.sqrt(
        visibleSeriesStdDevSum / visibleCount
      );
    }
    this.stdDev = Math.sqrt(stdDevSum / allValueCount);
    this.visibleStdDev = Math.sqrt(visibleStdDevSum / allVisibleValueCount);

    sum = 0;
    for (let i = 0; i < this.averages.length; i++) {
      sum += this.averages[i];
    }
    this.average = sum / this.averages.length;

    sum = 0;
    for (let i = 0; i < this.visibleAverages.length; i++) {
      sum += this.visibleAverages[i];
    }
    this.visibleAverage = sum / this.visibleAverages.length;
  }

  // following cases:
  // live pan (updateOnNewData) enabled or not // handled by handleUpdatedData(),
  //    we are only called to update the Date window if this is true!
  // initial call (no currentXrange yet set)
  // this.dyGraphOptions['dateWindowEnd'] // from Weih-VO, kick it
  updateDateWindow() {
    const blankSpaceOnFreshPercentage = 0;

    let dataEndTime = new Date();
    // this.endTime === 'now' ? new Date() : new Date(this.endTime);

    if (!this.currentXrange) {
      // initial call from handleInitialData
      if (this.startTime) {
        this.currentXrange = this.h.parseToSeconds(this.startTime);
      } else {
        if (!this.dataBeginTime) {
          this.dataBeginTime = this.displayedData[0][0];
        }
        dataEndTime = this.displayedData[this.displayedData.length - 1][0];
        if (!this.dataEndTime) {
          this.dataEndTime = dataEndTime;
        }

        this.currentXrange =
          (dataEndTime.valueOf() - this.dataBeginTime.valueOf()) / 1000;
      }
    }

    const dataBeginTime = new Date(
      dataEndTime.valueOf() - this.currentXrange * 1000
    );

    const displayShift =
      (this.currentXrange * blankSpaceOnFreshPercentage) / 100;
    dataEndTime.setSeconds(dataEndTime.getSeconds() + displayShift);
    dataBeginTime.setSeconds(dataBeginTime.getSeconds() + displayShift);

    this.dyGraphOptions['dateWindow'] = [
      dataBeginTime.valueOf(),
      dataEndTime.valueOf(),
    ];
    this.fromZoom = dataBeginTime;
    this.toZoom = dataEndTime;
    this.returnCurrentZoom.emit(this.dyGraphOptions['dateWindow']);
  }

  resetData() {
    // this.lastReset = new Date();
    while (this.displayedData.length) {
      this.displayedData.pop(); // fastest way to clear array
    }
    this.dataBeginTime = this.toZoom;
    this.dataEndTime = this.toZoom;

    this.Dygraph.updateOptions({ file: this.displayedData });
  }

  whoami() {
    if (this.columnLabels) {
      if (this.columnLabels[0]) {
        if (this.columnLabels[0]['__name__']) {
          return this.columnLabels[0]['__name__'];
        } else {
          console.log("whoami: no this.columnLabels[0]['__name__']");
          return this.columnLabels[0];
        }
      } else {
        console.log('whoami: no this.columnLabels[0]');
        return this.columnLabels;
      }
    } else {
      console.log('whoami: no this.columnLabels');
      return this;
    }
  }

  highLightBackgroundLevels(canvas, area, g) {
    let bglevels = undefined;
    if (
      !g['parent'] ||
      !Array.isArray(g.parent['backGroundLevels']) ||
      g.parent.backGroundLevels.length < 2
    ) {
      bglevels = g.getOption('backGroundLevels');
      console.log('highLightBackgroundLevels: no parent');
      console.log('bglevels', bglevels);
    }
    function highlight_period(y_start, y_end) {
      const y_min = g.toDomYCoord(y_start);
      const y_max = g.toDomYCoord(y_end);
      const area_h = y_max - y_min;
      // console.log(area.x, y_min, area.w, area_h);
      canvas.fillRect(area.x, y_min, area.w, area_h);
    }

    const backGroundLevels = bglevels ? bglevels : g.parent.backGroundLevels;

    let last_y = backGroundLevels[0][0];
    for (let i = 1; i < backGroundLevels.length; i++) {
      const level = backGroundLevels[i];
      canvas.fillStyle = level[1];
      // console.log(canvas.fillStyle, last_y, level[0]);

      highlight_period(last_y, level[0]);
      last_y = level[0];
    }
  }
  highlightDefaultBackground(canvas, area, g) {
    const graphbg = g.hasOwnProperty('parent')
      ? g.parent.graphBackGroundColor
      : '#3F3F3F';
    canvas.fillStyle = graphbg;
    canvas.fillRect(area.x, area.y, area.w, area.h);
  }

  toggleOptions() {
    this.optionsOpen = !this.optionsOpen;
    setTimeout(() => {
      this.Dygraph.resize(undefined, undefined);
    }, 150);
  }

  pan(direction: string) {
    const dw = this.Dygraph.getOption('dateWindow');
    const currentTimeRangeSeconds = dw[1].valueOf() - dw[0].valueOf();
    const panFor = currentTimeRangeSeconds * this.panAmount;
    console.log([direction, this.panAmount, panFor]);
    if (direction === 'forward') {
      dw[0] = new Date(dw[0].valueOf() + panFor);
      dw[1] = new Date(dw[1].valueOf() + panFor);
    }
    if (direction === 'back') {
      dw[0] = new Date(dw[0].valueOf() - panFor - 1); // offset for avoiding no reloading on auto zoom
      dw[1] = new Date(dw[1].valueOf() - panFor + 1);
    }
    this.Dygraph.updateOptions({ dateWindow: dw });
  }

  fullZoom() {
    this.Dygraph.resetZoom();
  }
  zoom(factor: number) {
    const fromValue = this.fromZoom.valueOf();
    const toValue = this.toZoom.valueOf();

    const difference = toValue - fromValue;
    const distanceToCenter = difference / 2;
    // const center = fromValue + distanceToCenter;

    const newdifference = factor * difference;
    const newDistanceToCenter = newdifference / 2;
    const newFrom = fromValue + (distanceToCenter - newDistanceToCenter) + 1;
    const newTo = toValue - (distanceToCenter - newDistanceToCenter) - 1; // offset for avoiding no reloading on auto zoom

    this.toZoom = new Date(newTo);
    this.fromZoom = new Date(newFrom);
    this.Dygraph.updateOptions({
      dateWindow: [newFrom, newTo],
    });
  }

  //note: if logscale not globally set, no logscale graphs are displayed
  switchLogScale(axis = 'y1') {
    let axisob = this.dyGraphOptions['axes'];
    let y = axis == 'y2' ? 'y2' : 'y';
    if (!axisob.hasOwnProperty(y)) {
      axisob[y] = {};
    }

    axisob[y]['logscale'] = axisob[y]['logscale'] ? false : true;
    this.Dygraph.updateOptions({
      logscale: axisob.y.logscale || axisob.y2.logscale,
      axes: this.dyGraphOptions['axes'],
    });
    console.log(
      'new logscale:',
      axis,
      axisob[y]['logscale'],
      this.dyGraphOptions['axes']
    );
  }
  toggleLegend() {
    if (this.dyGraphOptions.legend == 'always') {
      this.dyGraphOptions.legend = 'never';
    } else {
      this.dyGraphOptions.legend = 'always';
    }

    this.Dygraph.updateOptions({
      legend: this.dyGraphOptions.legend,
    });
  }

  calculateTimeRange(
    startTime: string,
    endTime: string,
    reducePoints = false
  ): [Date, Date] {
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

    endDate = new Date(); // this.endTime === 'now' ? new Date() : new Date(this.endTime);

    const seconds = this.zoomValue * this.zoomMultiplicator;
    startDate = new Date(endDate.valueOf() - seconds * 1000);

    this.fromZoom = startDate;
    this.toZoom = endDate;
    this.Dygraph.updateOptions({
      dateWindow: [startDate.valueOf(), endDate.valueOf()],
    });
  }

  exportCSV(data?) {
    const labels = this.dyGraphOptions['labels'];
    if (!data) {
      data = this.h.returnDataRange(
        this.displayedData,
        this.fromZoom,
        this.toZoom
      );
    }
    let visibleLabels = [labels[0]]; // Date
    for (let i = 1; i < labels.length; i++) {
      if (this.dyGraphOptions.visibility[i - 1]) {
        visibleLabels.push(labels[i]);
      }
    }
    let visibleData = [];
    for (let r = 0; r < data.length; r++) {
      const origRow = data[r];
      let newRow = [origRow[0]]; // Timestamp
      for (let c = 0; c < origRow.length; c++) {
        if (this.dyGraphOptions.visibility[c - 1]) {
          newRow.push(origRow[c]);
        }
      }
      visibleData.push(newRow);
    }
    this.h.exportCSV(visibleData, visibleLabels, this.exportUTC);
  }
  getAverage(time = '1m', index = 1) {
    let time_s = this.h.parseToSeconds(time);
    if (!time_s) {
      time_s = 60;
    }
    const item_count = Math.ceil(time_s); // / this.dataBaseQueryStepMS) * 1000);
    if (item_count < 1) {
      console.log('getAvg: no items to average');
      return;
    }

    const avgdata = this.displayedData.slice(
      this.displayedData.length - item_count
    );
    let sum = 0;
    avgdata.forEach((row) => {
      sum += row[index];
    });
    return sum / item_count;
  }

  toggleStats() {
    this.stats = !this.stats;
    setTimeout(() => {
      this.Dygraph.resize(undefined, undefined);
    }, 50);
  }
  tVis4Label(label: string) {
    // console.log('tVis4Label with', label);
    for (let i = 1; i < this.columnLabels.length; i++) {
      const ilabel = this.columnLabels[i];
      if (label == ilabel) {
        // console.log(i, ilabel);
        this.dyGraphOptions.visibility[i - 1] =
          !this.dyGraphOptions.visibility[i - 1];
        break;
      }
    }
    this.showAllifNone();
    this.Dygraph.updateOptions({
      visibility: this.dyGraphOptions.visibility,
    });
  }
  showAllifNone() {
    // console.log('show all?', this.dyGraphOptions.visibility);
    let everythingHidden = true;
    for (let i = 0; i < this.dyGraphOptions.visibility.length; i++) {
      if (this.dyGraphOptions.visibility[i] === true) {
        everythingHidden = false;
        break;
      }
    }
    if (everythingHidden) {
      for (let i = 0; i < this.dyGraphOptions.visibility.length; i++) {
        this.dyGraphOptions.visibility[i] = true;
      }
    }
  }
  showSingle(label: String) {
    console.log('single', label);

    for (let i = 1; i < this.columnLabels.length; i++) {
      const ilabel = this.columnLabels[i];
      this.dyGraphOptions.visibility[i - 1] = label == ilabel ? true : false;
    }
    this.Dygraph.updateOptions({
      visibility: this.dyGraphOptions.visibility,
    });
  }
  fromDatePickerChanged($event) {
    const newFrom = $event['value'];

    const toSetDate = new Date(newFrom.valueOf());
    toSetDate.setHours(this.fromZoom.getHours());
    toSetDate.setMinutes(this.fromZoom.getMinutes());
    toSetDate.setSeconds(this.fromZoom.getSeconds());
    toSetDate.setMilliseconds(this.fromZoom.getMilliseconds());

    this.fromZoom = toSetDate;
    this.Dygraph.updateOptions({
      dateWindow: [this.fromZoom.valueOf(), this.toZoom.valueOf()],
    });
  }
  toDatePickerChanged($event) {
    const newTo = $event['value'];

    const toSetDate = new Date(newTo.valueOf());
    toSetDate.setHours(this.toZoom.getHours());
    toSetDate.setMinutes(this.toZoom.getMinutes());
    toSetDate.setSeconds(this.toZoom.getSeconds());
    toSetDate.setMilliseconds(this.toZoom.getMilliseconds());

    this.toZoom = toSetDate;
    this.Dygraph.updateOptions({
      dateWindow: [this.fromZoom.valueOf(), this.toZoom.valueOf()],
    });
  }
}
