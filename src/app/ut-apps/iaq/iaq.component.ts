import { Component, OnInit } from '@angular/core';
import { UtFetchdataService } from '../../ut-fetchdata.service';

@Component({
  selector: 'app-iaq',
  templateUrl: './iaq.component.html',
  styleUrls: ['./iaq.component.css']
})
export class IaqComponent implements OnInit {
  constructor(private utFetchdataService: UtFetchdataService) {}

  ngOnInit() {
    this.getData();
  }

  currentData = {
    timestamp: 0,
    value: "00"};
  CO2_value = 0;

   getData() {
    this.utFetchdataService.getHTTPData().subscribe(
      (data: Config) =>
        (this.currentData = {
          timestamp: data['data']['result'][0]['value'][0] * 1000,
          value: parseFloat(data['data']['result'][0]['value'][1], 10)

        })
    );
  }
}
