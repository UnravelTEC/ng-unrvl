import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

@Component({
  selector: 'app-noir',
  templateUrl: './noir.component.html',
  styleUrls: ['./noir.component.scss']
})
export class NoirComponent implements OnInit {
  constructor(
    private globalSettings: GlobalSettingsService,
    private utFetchdataService: UtFetchdataService
  ) {
    this.globalSettings.emitChange({ appName: 'NoIR-Camera' });
  }

  ngOnInit() {}

  start() {
    this.utFetchdataService
      .getHTTPData('/api/noir/running.php')
      .subscribe((data: Object) => this.ack(data));
  }

  stop() {
    this.utFetchdataService
      .getHTTPData('/api/noir/stopping.php')
      .subscribe((data: Object) => this.ack(data));
  }

  ack(data: Object) {}
}
