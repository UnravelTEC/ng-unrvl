import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'SDARS - Sensor Data Access and Retrieval System';
  prod = environment.production;
  restMsg = '';
  data = [];

  options = {};

  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  public constructor(private http: HttpClient, private titleService: Title) {
    this.setTitle('UnravelTEC');
  }

  ngOnInit() {
    this.http.get('/rest/test').subscribe(
      value => {
        this.restMsg = value['msg'];
      },
      error => {
        this.restMsg = error.message;
      }
    );
    this.data = [
      [new Date('2008/05/07'), 75],
      [new Date('2008/05/08'), 70],
      [new Date('2008/05/09'), 80]
    ];
    this.options = {
      width: 'auto',
      labels: ['Date', 'Temperature'],
      xlabel: 'X label text',
      ylabel: 'Y label text',
      title: 'Working title :)',
      animatedZooms: true,
      pointSize: 4
  }
  }
}
