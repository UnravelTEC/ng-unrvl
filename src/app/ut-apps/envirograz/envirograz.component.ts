import { Component, OnInit } from "@angular/core";
import { GlobalSettingsService } from "../../core/global-settings.service";

@Component({
  selector: "app-envirograz",
  templateUrl: "./envirograz.component.html",
  styleUrls: ["./envirograz.component.scss"]
})
export class EnvirograzComponent implements OnInit {
  graphstyle = {
    position: "absolute",
    top: "0",
    bottom: "0.5rem",
    left: "0.5rem",
    right: "9rem"
  };
  graphstylePM = {
    position: "absolute",
    top: "0",
    bottom: "0.5rem",
    left: "0.5rem",
    right: "15rem"
  };
  multiplicateFactors = [1000];

  isNaN(a) {
    return isNaN(a);
  }

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: "Enviro Graz" });
  }

  labelBlackListT = [
    "interval",
    "featureset",
    "serial",
    "id",
    "__name__",
    "node"
  ];
  ngOnInit() {}
}
