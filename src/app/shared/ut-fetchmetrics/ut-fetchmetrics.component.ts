import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GlobalSettingsService } from '../../core/global-settings.service';


// fetch Prometheus Metrics!
@Component({
  selector: 'app-ut-fetchmetrics',
  templateUrl: './ut-fetchmetrics.component.html',
  styleUrls: ['./ut-fetchmetrics.component.scss']
})
export class UtFetchmetricsComponent implements OnInit, OnDestroy {
  constructor(
    private http: HttpClient,
    private globalSettings: GlobalSettingsService
  ) {}

  metrics = {}; // array of metrics gotten, see sample

  @Input() sensorname: String;
  @Input() interval = 1; //1,2,3,5,10,0.1 possible

  private fetchUrl = '';

  sampleMetric = {
    $__name__: {
      value: 42,
      tags: {
        sensor: '',
        bla: 'blubb'
      }
    }
  };
  ngOnInit() {
    const api = this.globalSettings.getAPIEndpoint();
    const timestring =
      this.interval >= 1
        ? String(this.interval) + 's'
        : String(this.interval * 1000) + 'ms';
    this.fetchUrl = api.replace(/api\/$/, 'metrics/') + timestring + '.php';
    console.log('fetchurl: ', this.fetchUrl);

    // this.metrics = { type5: { value: 42 } };

    this.fetchResult();
  }
  private Death = false;
  ngOnDestroy() {
    this.Death = true;
    console.log('byebye FetchMetrics');
  }
  fetchResult() {
    this.http
      .get(this.fetchUrl, { responseType: 'text' })
      .subscribe(
        (data: String) => this.handleResult(data),
        data => this.handleError(data)
      );
  }

  handleResult(data: String) {
    //console.log(data);
    this.metrics = {};
    let arrayOfLines = data.match(/[^\r\n]+/g);
    if (!arrayOfLines) {
      console.error('data error, empty.', data);
      this.interval = 5;
    } else {
      for (let i = 0; i < arrayOfLines.length; i++) {
        const line = arrayOfLines[i];
        const metricname = line.match(/[^{ ]+/)[0];
        const valueArray = line.match(/[^}]+/g);
        const value = valueArray[valueArray.length - 1];

        // console.log('metric: ', metricname, value);

        if (this.sensorname) {
          const sensorArray = line.match(/sensor="(.*?)"/);
          const sensor =
            sensorArray && sensorArray.length ? sensorArray[0] : 'unknown';
          if (sensor === 'sensor="' + this.sensorname.toUpperCase() + '"') {
            // console.log('sensor: ', sensor);
            // console.log('value: ', value);
            this.metrics[metricname] = { value: value };
          }
        } else {
          this.metrics[metricname] = { value: value };
        }
      }
      // console.log(this.metrics);
      this.interval = 1;
    }
    if (!this.Death) {
      setTimeout(() => {
        this.fetchResult();
      }, this.interval * 1000);
    }
  }
  handleError(data) {
    console.error(data);
  }
}
