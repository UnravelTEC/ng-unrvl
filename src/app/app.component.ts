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

  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  public constructor(private http: HttpClient, private titleService: Title) {}

  ngOnInit() {
    this.setTitle('UnravelTEC');

    // this.http.get('/rest/test').subscribe(
    //   value => {
    //     this.restMsg = value['msg'];
    //   },
    //   error => {
    //     this.restMsg = error.message;
    //   }
    // );
  }
}
