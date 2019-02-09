import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { GlobalSettingsService } from 'app/core/global-settings.service';

@Injectable({
  providedIn: 'root'
})
export class UtFetchdataService {
  constructor(
    private http: HttpClient,
    private globalSettingsService: GlobalSettingsService
  ) {}

  httpURL =
    'http://belinda.cgv.tugraz.at:9090/api/v1/query?query=co2{location="FuzzyLab",sensor="scd30"}';
  Config = {};

  queryEndPoint = 'http://belinda.cgv.tugraz.at:9090/api/v1/';
  queryDefaultStep = 1000; // ms

  getHTTPData(url: string) {
    const thisurl = url ? url : this.httpURL;
    return this.http.get(thisurl);
  }

  public constructPrometheusEndPoint(
    server?: string,
    port?: string,
    path?: string
  ) {
    if (!server && !port && !path) {
      return this.globalSettingsService.getPrometheusEndpoint();
    }

    if (!port) {
      port = this.globalSettingsService.defaultPrometheusPort;
    }
    if (port) {
      port = ':' + port;
    }
    if (!port) {
      port = '';
    }
    if (!path) {
      path = this.globalSettingsService.defaultPrometheusPath;
    }
    const protocol = port === ':443' ? 'https://' : 'http://';
    const protAndHost = server.startsWith('http') ? server : protocol + server;
    return protAndHost + port + (path.startsWith('/') ? '' : '/') + path;
  }

  private buildRangeQuery(
    queryEndPoint: string,
    queryString: string,
    start: Date,
    end: Date,
    step
  ) {
    const url =
      queryEndPoint +
      'query_range?query=' +
      queryString +
      '&start=' +
      start.toISOString() +
      '&end=' +
      end.toISOString() +
      '&step=' +
      step +
      'ms';
    // console.log(url);
    return url;
  }

  getRange(
    queryString: string,
    start: Date,
    end: Date,
    step = this.queryDefaultStep,
    queryEndPoint = this.queryEndPoint
  ) {
    // console.log(start);
    // console.log(end);
    return this.http.get(
      this.buildRangeQuery(queryEndPoint, queryString, start, end, step)
    );
  }
  postData(url: string, data: any) {
    this.http.post(url, data).subscribe(
      (res: any) => {
        console.log(res);
      },
      (error: any) => {
        console.log(error);
      }
    );

    console.log(['postData', url, data]);
  }
}
