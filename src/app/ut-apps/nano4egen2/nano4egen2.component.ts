import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import * as Paho from 'paho-mqtt';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';
import { LocalStorageService } from 'app/core/local-storage.service';
import { cloneDeep, forIn } from 'lodash-es';

// import cloneDeep from 'lodash-es/cloneDeep';

@Component({
  selector: 'app-nano4egen2',
  templateUrl: './nano4egen2.component.html',
  styleUrls: ['./nano4egen2.component.scss']
})
export class Nano4EGen2Component implements OnInit, OnDestroy {
  status = 'init'; // | connecting | connected | failed | lost
  public disconnects = 0;
  private client;
  private clientID = 'clientID_' + String(Math.random() * 100);
  // public topic = '+/sensors/SPS30/particulate_matter_typpartsize_um';

  public topic = '#';
  public topics = [
    'nano4e-gen2/actuators/GPIOEXP/DIGITBOARD/settings',
    'nano4e-gen2/actuators/GPIOEXP/AFEBOARD1/settings',
    'nano4e-gen2/actuators/GPIOEXP/AFEBOARD2/settings',
    'nano4e-gen2/actuators/GPIOEXP/AFEBOARD3/settings',
    'nano4e-gen2/actuators/GPIOEXP/AFEBOARD4/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD1/MEAS/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD1/LED/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD1/HEAT/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD2/MEAS/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD2/LED/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD2/HEAT/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD3/MEAS/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD3/LED/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD3/HEAT/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD4/MEAS/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD4/LED/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD4/HEAT/settings',
  ]
  // private ADCtopic = "/sensors/ADS1115/i2c-3_"
  // private ADCmappings = {
  //   "AFEBOARD1": "0x48",
  //   "AFEBOARD2": "0x49",
  //   "AFEBOARD3": "0x4a",
  //   "AFEBOARD4": "0x4b",
  // }

  public mqttMessages = [
    { date: new Date(), topic: 'sample topic', payload: 'sample payload' }
  ];
  public retainedMqttMessages = [];
  public maxlen = 3;
  public updateMessages = true;

  public lastFocusID = "";

  public dygData = [
    [new Date(new Date().valueOf() - 1000), 1],
    [new Date(), 2]
  ];
  public dygLabels = ['Date', 'particulate_matter_typpartsize_um'];
  changeTrigger = 0;

  public sensorData = {};
  public sensorDataExample = {
    myBME: {
      temperature_degC: {
        index: {
          value: 25.5,
          tags: { id: '0x77' }
        }
      },

      pressure_hPA: {
        index: {
          value: 900,
          tags: { id: '0x77' }
        }
      },
      humidity_rel_percent: {
        index: {
          value: 42,
          tags: { id: '0x77' }
        }
      }
    }
  };

  graphstyle = {
    position: 'absolute',
    top: '0',
    bottom: '0',
    left: '0',
    right: '0'
  };

  public DACstep = {};

  public DACstatus = { "AFEBOARD1": { "LED": { "ch1_V": undefined } } }
  public DACstatusUserUnit = {}
  public channels = ["ch1_V", "ch2_V", "ch3_V", "ch4_V"];
  public channelNames = { "ch1_V": "Px 1", "ch2_V": "Px 2", "ch3_V": "Px 3", "ch4_V": "Px 4" }
  public DACnewValues = {}
  public DACnewValuesSent = {}
  public DACnewValuesUserUnit = {}
  public userUnits = { 'HEAT': 'mA', 'LED': 'mA', 'MEAS': 'µA' }
  public userUnitsConvFactor = { 'HEAT': 10, 'LED': 10, 'MEAS': 10 }
  public heatTemps = {
    "AFEBOARD1": { "ch1_V": undefined, "ch2_V": undefined, "ch3_V": undefined, "ch4_V": undefined },
    "AFEBOARD2": { "ch1_V": undefined, "ch2_V": undefined, "ch3_V": undefined, "ch4_V": undefined },
    "AFEBOARD3": { "ch1_V": undefined, "ch2_V": undefined, "ch3_V": undefined, "ch4_V": undefined },
    "AFEBOARD4": { "ch1_V": undefined, "ch2_V": undefined, "ch3_V": undefined, "ch4_V": undefined }
  }
  public heatTempsUser = {
    "AFEBOARD1": { "ch1_V": undefined, "ch2_V": undefined, "ch3_V": undefined, "ch4_V": undefined },
    "AFEBOARD2": { "ch1_V": undefined, "ch2_V": undefined, "ch3_V": undefined, "ch4_V": undefined },
    "AFEBOARD3": { "ch1_V": undefined, "ch2_V": undefined, "ch3_V": undefined, "ch4_V": undefined },
    "AFEBOARD4": { "ch1_V": undefined, "ch2_V": undefined, "ch3_V": undefined, "ch4_V": undefined }
  }
  public measAutoChannel = { // _V name only for easier accessing in script
    "AFEBOARD1": { "ch1_V": undefined, "ch2_V": undefined, "ch3_V": undefined, "ch4_V": undefined },
    "AFEBOARD2": { "ch1_V": undefined, "ch2_V": undefined, "ch3_V": undefined, "ch4_V": undefined },
    "AFEBOARD3": { "ch1_V": undefined, "ch2_V": undefined, "ch3_V": undefined, "ch4_V": undefined },
    "AFEBOARD4": { "ch1_V": undefined, "ch2_V": undefined, "ch3_V": undefined, "ch4_V": undefined }
  }


  public heatCurves = {
    "APPS": [
      [0, 0],
      [7, 77],
      [9.6, 113],
      [11.5, 148],
      [12.9, 182],
      [14.2, 214],
      [15.2, 245],
      [16.2, 275],
      [17, 303],
      [17.7, 330],
      [18.4, 356],
      [19.1, 381],
      [19.7, 404],
      [20.3, 427],
      [20.8, 448],
      [21.4, 467],
      [21.9, 486],
      [22.4, 503],
      [22.8, 519],
      [23.3, 533],
      [23.8, 547],
    ],
    "Nano4E": [
      [0, 0],
      [6, 10],
      [7.5, 20],
      [10, 30],
      [11.5, 40],
      [12.7, 50],
      [13.6, 60],
      [14.5, 70],
      [15.3, 80],
      [16, 90],
      [16.7, 100],
      [17.3, 110],
      [17.7, 120],
      [18.3, 130],
      [18.7, 140],
      [19.2, 150],
      [19.5, 160],
      [19.7, 170],
      [20.1, 180],
      [20.5, 190],
      [20.7, 200],
      [21.1, 210],
      [21.3, 220],
      [21.6, 230],
      [21.8, 240],
      [22.0, 250],
      [22.25, 260],
      [22.4, 270],
      [22.7, 280],
      [22.8, 290],
      [23.0, 300],
      [23.2, 310],
      [23.5, 320],
      [23.6, 330],
      [23.7, 340],
      [23.85, 350],
    ]
  }
  public boardTypes = { // "APPS" or "Nano4E"
    "AFEBOARD1": "APPS",
    "AFEBOARD2": "APPS",
    "AFEBOARD3": "APPS",
    "AFEBOARD4": "APPS",
  }
  // example_payload = {
  //   "config": {
  //     "tags": { "chipname": "allein" },
  //     "ch1": { "enabled": true, "tags": { "material": "a" } },
  //     "ch2": { "enabled": true, "tags": { "material": "b" } },
  //     "ch3": { "enabled": true, "tags": { "material": "c" } },
  //     "ch4": { "enabled": true, "tags": { "material": "d" } }
  //   }
  // }

  public temp_conf = -1;
  public temp_real = -42;
  public temp_new = 0;

  public pins = {
    'DIGITBOARD': { 'MICS_HEATER': 0b0001, '3V3_SUPPLY': 0b0010, '5V_SUPPLY': 0b0100, 'SCD30_SUPPLY': 0b1000, '5V_CLEAN_SUPPLY': 0b10000000 },
    // 'DIGITBOARD': { 'MICS_HEATER': 0b0001, '3V3_SUPPLY': 0b0010, '5V_SUPPLY': 0b0100, 'SCD30_SUPPLY': 0b1000, '7V_SUPPLY_NEN': 0b1000000, '5V_CLEAN_SUPPLY': 0b10000000 },
    "AFEBOARD1": { "LED11": 0b1, "LED12": 0b10, "LED21": 0b100, "LED22": 0b1000, "LED31": 0b10000, "LED32": 0b100000, "LED41": 0b1000000, "LED42": 0b10000000 },
    "AFEBOARD2": { "LED11": 0b1, "LED12": 0b10, "LED21": 0b100, "LED22": 0b1000, "LED31": 0b10000, "LED32": 0b100000, "LED41": 0b1000000, "LED42": 0b10000000 },
    "AFEBOARD3": { "LED11": 0b1, "LED12": 0b10, "LED21": 0b100, "LED22": 0b1000, "LED31": 0b10000, "LED32": 0b100000, "LED41": 0b1000000, "LED42": 0b10000000 },
    "AFEBOARD4": { "LED11": 0b1, "LED12": 0b10, "LED21": 0b100, "LED22": 0b1000, "LED31": 0b10000, "LED32": 0b100000, "LED41": 0b1000000, "LED42": 0b10000000 },
  };

  public Nano4EChipCfgTempl = {
    "name": "",
    "leds": { "LED11": undefined, "LED12": undefined, "LED21": undefined, "LED22": undefined, "LED31": undefined, "LED32": undefined, "LED41": undefined, "LED42": undefined },
    "surfaces": {
      "px1": { "name": "", "enabled": true },
      "px2": { "name": "", "enabled": true },
      "px3": { "name": "", "enabled": true },
      "px4": { "name": "", "enabled": true }
    },
  }
  public Nano4EChipCfg = {
    "AFEBOARD1": {},
    "AFEBOARD2": {},
    "AFEBOARD3": {},
    "AFEBOARD4": {}
  }
  public ADCtopics = {}

  public gpios = {
    'DIGITBOARD': {
      'MICS_HEATER': undefined,
      '3V3_SUPPLY': undefined,
      '5V_SUPPLY': undefined,
      'SCD30_SUPPLY': undefined,
      // '7V_SUPPLY_NEN': undefined,
      '5V_CLEAN_SUPPLY': undefined
    }
  };
  public pinNames = {
    'MICS_HEATER': 'MICS6814 Heater',
    '3V3_SUPPLY': '3V3 switched power supply',
    '5V_SUPPLY': '5V switched power supply',
    'SCD30_SUPPLY': 'SCD30 CO2 sensor switched power supply',
    // '7V_SUPPLY_NEN': '7V switched power supply ¬en',
    '5V_CLEAN_SUPPLY': '5V_clean switched power supply'
  }
  public valve_reason = "";

  public services = []; // only gets filled with 1 entry
  public loadingText = 'Initializing...';
  public fanspeed = 0;

  private ls_api_user;
  private ls_api_pass;

  public debugmqtt: boolean = false;

  constructor(private gss: GlobalSettingsService, private utHTTP: UtFetchdataService, private localStorage: LocalStorageService,) {
    this.gss.emitChange({ appName: 'Nano4E-Gen2 Control' });

    const DACtypes = ["MEAS", "LED", "HEAT"]
    for (let i = 1; i <= 4; i++) {
      const board = "AFEBOARD" + String(i)
      this.DACstatus[board] = {}
      DACtypes.forEach(DACname => {
        this.DACstatus[board][DACname] = {}
        this.channels.forEach(channel => {
          this.DACstatus[board][DACname][channel] = NaN
        });
      });
    }
    this.DACstatusUserUnit = cloneDeep(this.DACstatus)
    this.DACnewValues = cloneDeep(this.DACstatus)
    this.DACnewValuesSent = cloneDeep(this.DACstatus)
    this.DACnewValuesUserUnit = cloneDeep(this.DACstatus)

    for (const boardname in this.pins) {
      if (Object.prototype.hasOwnProperty.call(this.pins, boardname)) {
        const board = this.pins[boardname];
        this.gpios[boardname] = {}
        for (const pinkey in board) {
          if (Object.prototype.hasOwnProperty.call(board, pinkey)) {
            this.gpios[boardname][pinkey] = undefined
          }
        }
      }
    }

    for (const afename in this.Nano4EChipCfg) {
      this.Nano4EChipCfg[afename] = cloneDeep(this.Nano4EChipCfgTempl)
    }
    this.DACstep = { '0-2.048': (2.048 / 4095).toFixed(4), '2.048-4.096': (4.096 / 4095).toFixed(4), '4.096-5': (5 / 4095).toFixed(5) }

  }

  public lang = "de-DE"

  ngOnInit() {
    let server = this.gss.server.serverName;
    console.log(server);
    console.log("lang", navigator.language);
    this.lang = navigator.language

    this.client = new Paho.Client(server, 1885, this.clientID);
    this.client.onConnectionLost = this.onConnectionLost;
    this.client.onMessageArrived = this.onMessageArrived;
    document['MQTT_CLIENT'] = this.client;
    document['MQTT_CLIENT']['father'] = this;
    console.log('onInit', this.client);
    this.connect();

    this.ls_api_user = this.localStorage.get('api_user');
    this.ls_api_pass = this.localStorage.get('api_pass');

    for (let i = 1; i <= 4; i++) {
      this.ADCtopics["AFEBOARD" + i.toString()] = this.gss.server.hostname + '/sensors/ADS1115/i2c-3_0x' + (0x47 + i).toString(16) + '/config'
    }
    // this.getService();

    // this.dygLabels = ;
  }
  ngOnDestroy() {
    this.stop();
  }

  onFocus(id) {
    console.log(id)
    this.lastFocusID = id
  }

  toggleDebug() {
    this.debugmqtt = !this.debugmqtt;
  }

  stop() {
    for (let i = 0; i < this.topics.length; i++) {
      this.client.unsubscribe(this.topics[i], {});
    }
  }
  connect() {
    this.client.connect({
      onSuccess: this.onConnect,
      onFailure: this.onFailure
    });
    this.status = 'connecting';
  }
  onConnect() {
    console.log('onConnect');
    // console.log(this);
    const father = document['MQTT_CLIENT']['father'];
    for (let i = 0; i < father.topics.length; i++) {
      document['MQTT_CLIENT'].subscribe(father.topics[i]);
    }

    father.status = 'connected';
  }

  setGPIO(expander, pin: string, newstatus) {
    const values = {}
    values[pin] = newstatus
    this.client.publish(this.gss.server.hostname + "/actuators/GPIOEXP/" + expander + "/set",
      JSON.stringify({ "values": values, "UTS": new Date().valueOf() / 1000 }),
      0,
      true);
    console.log(this.gss.server.hostname + "/actuators/GPIOEXP/" + expander + "/set",
      { "values": { pin: newstatus }, "UTS": new Date().valueOf() / 1000 });

  }

  public animateOnClickShow = false;
  setDAC() {
    for (const AFEBOARDid in this.DACnewValuesSent) {
      if (Object.prototype.hasOwnProperty.call(this.DACnewValuesSent, AFEBOARDid)) {
        const AFEBOARD = this.DACnewValuesSent[AFEBOARDid];
        for (const DACid in AFEBOARD) {
          if (Object.prototype.hasOwnProperty.call(AFEBOARD, DACid)) {
            const DAC = AFEBOARD[DACid];
            for (const channel in DAC) {
              if (Object.prototype.hasOwnProperty.call(DAC, channel)) {
                DAC[channel] = NaN
              }
            }
          }
        }
      }
    }
    for (const AFEBOARDid in this.DACnewValues) {
      if (Object.prototype.hasOwnProperty.call(this.DACnewValues, AFEBOARDid)) {
        const AFEBOARD = this.DACnewValues[AFEBOARDid];
        for (const DACid in AFEBOARD) {
          if (Object.prototype.hasOwnProperty.call(AFEBOARD, DACid)) {
            const DAC = AFEBOARD[DACid];
            let values = {}
            let tags = {}
            for (const channel in DAC) {
              if (Object.prototype.hasOwnProperty.call(DAC, channel)) {
                const value = DAC[channel];
                if (DACid == "HEAT" && value > 2.385) {
                  alert(String(value) + " too high for heater " + channel + " @ " + AFEBOARDid)
                  continue;
                }
                if (!isNaN(value) && value !== undefined && value !== null) {
                  values[channel] = value;
                  this.DACnewValuesUserUnit[AFEBOARDid][DACid][channel] = value * this.userUnitsConvFactor[DACid]
                  if (DACid == "HEAT") {
                    tags["ch" + channel.charAt(2)] = {
                      "chip": this.boardTypes[AFEBOARDid]
                    }
                    if (this.heatTempsUser[AFEBOARDid][channel]) {
                      tags["ch" + channel.charAt(2)]["heater_degC"] = this.heatTempsUser[AFEBOARDid][channel].toString()
                    }
                  }
                  if (DACid == "MEAS") {
                    tags["ch" + channel.charAt(2)] = {
                      "meas_current_uA": this.DACnewValuesUserUnit[AFEBOARDid][DACid][channel],
                      "mcurtl": "manual"
                    }

                  }
                }
              }
            }
            if (Object.keys(values).length > 0) {
              let payload = { "values": values, "UTS": new Date().valueOf() / 1000 } //  { "values": { "ch1_V": *, "ch2_V": * }, "UTS": * }
              if (Object.keys(tags).length > 0) {
                payload["tags"] = tags
              }
              this.client.publish(this.gss.server.hostname + "/actuators/DAC/" + AFEBOARDid + "/" + DACid + "/set",
                JSON.stringify(payload),
                0,
                true);
              console.log(this.gss.server.hostname + "/actuators/DAC/" + AFEBOARDid + "/" + DACid + "/set", payload);
              for (const channel in values) {
                if (Object.prototype.hasOwnProperty.call(values, channel)) {
                  const value = values[channel];
                  this.DACnewValuesSent[AFEBOARDid][DACid][channel] = value
                }
              }

            }
          }
        }
      }
      this.animateOnClickShow = true;
      setTimeout(() => {
        this.animateOnClickShow = false;
      }, 500);
    }

    console.log(document.getElementById(this.lastFocusID));
    document.getElementById(this.lastFocusID).focus();
  }
  setChipCfg(chip = "") {
    console.log("setChipCfg", chip, this.Nano4EChipCfg);
    if (chip) {
      const data = this.Nano4EChipCfg[chip]
      const payload = {}
      if (data["name"]) {
        payload["tags"] = { "chipname": data["name"] }
      }
      for (const surface in data['surfaces']) {
        const plkey = "ch" + surface.slice(-1)
        const px = data['surfaces'][surface]
        payload[plkey] = { "enabled": px["enabled"], "tags": { "material": px["name"] } }
      }
      for (const led in data['leds']) {
        const channel = "ch" + led.charAt(3)
        const valkey = led + "_nm"
        const value = data['leds'][led] ? String(data['leds'][led]) : ""
        if (channel in payload) {
          payload[channel]["tags"][valkey] = value
        } else
          payload[channel] = { "tags": { valkey: value } }
      }
      this.client.publish(this.ADCtopics[chip],
        JSON.stringify({ "config": payload, "UTS": new Date().valueOf() / 1000 }),
        0,
        true);
      console.log("mqtt sent to", this.ADCtopics[chip], payload);
      // LED-nm extra, needs to be syncronized with GPIOEXP
    }
  }

  onMessageArrived(message: Object) {
    const father = document['MQTT_CLIENT']['father'];

    const arr = message['topic'].split('/');
    if (arr.length < 2) { // e.g. topic "influx"
      console.log(message);
      return;
    }
    const type = arr[1];
    const actor = arr[2];
    const metric = arr[arr.length - 1];

    if (type == "sensor")
      console.log('got MQTT message from sensor', actor, 'about', metric, message);
    if (type == "actuator")
      console.log('got MQTT message from t', actor, 'about', metric, message);

    try {
      const payload = JSON.parse(message['payloadString']);

      if (payload["values"]) {
        const values = payload["values"]
        switch (metric) {
          case "temperature":
            father.temp_real = values["probe_degC"];
            break;
          case "settings":
            if (values.hasOwnProperty("reg")) {
              const board = arr[arr.length - 2];
              const value = values['reg'];
              for (const pinname in father.pins[board]) {
                if (Object.prototype.hasOwnProperty.call(father.pins[board], pinname)) {
                  const hexmask = father.pins[board][pinname];
                  father.gpios[board][pinname] = (!Boolean(hexmask & value)) ? "on" : "off"
                }
              }

            }

            if (actor == "DAC") {
              father.channels.forEach(channel => {
                if (values.hasOwnProperty(channel)) {
                  const board = arr[3]
                  const DAC = arr[4];
                  father.DACstatus[board][DAC][channel] = Math.round(values[channel] * 100000) / 100000
                  father.DACstatusUserUnit[board][DAC][channel] = Math.round(values[channel] * father.userUnitsConvFactor[arr[4]] * 1000) / 1000
                  father.DACnewValuesUserUnit[board][DAC][channel] = father.DACstatusUserUnit[board][DAC][channel]
                  if (DAC == 'HEAT') {
                    father.heatTemps[board][channel] = father.calcHeatT(father.DACstatusUserUnit[board][DAC][channel], father.boardTypes[board]);
                  }
                  else if (DAC == 'MEAS' && payload.hasOwnProperty("tags")) {
                    const tagchX = channel.slice(0, 3)
                    if (payload["tags"].hasOwnProperty(tagchX)) {
                      if (payload["tags"][tagchX].hasOwnProperty("amcurstep")) {
                        father.measAutoChannel[board][channel] = payload["tags"][tagchX]["amcurstep"]
                      }
                      if (payload["tags"][tagchX].hasOwnProperty("meas_current_uA")) {
                        father.DACstatusUserUnit[board][DAC][channel] = payload["tags"][tagchX]["meas_current_uA"]
                        father.DACnewValuesUserUnit[board][DAC][channel] = father.DACstatusUserUnit[board][DAC][channel]
                      }
                    }
                  }
                }
              });
            }
        }
      }

      const value = payload['value'];
      let tags = JSON.parse(message['payloadString']);
      const TSString = tags['UTS'];
      delete tags['value'];
      delete tags['UTS'];
      const index = JSON.stringify(tags);

      // console.log(payload);
      if (!father.sensorData[actor]) {
        father.sensorData[actor] = {};
      }
      if (!father.sensorData[actor][metric]) {
        father.sensorData[actor][metric] = {};
      }
      father.sensorData[actor][metric][index] = { value: value, tags: tags };

      let valueTimestamp = Number(TSString) * 1000;

      const sentDate =
        valueTimestamp > 0 ? new Date(valueTimestamp) : new Date();

      // father.dygData.push([sentDate, Number(value)]);
      // father.graph.updateGraph()
      father.changeTrigger += 1;
      // console.log(cloneDeep(father.dygData));

      if (message['retained']) {
        const msg = {
          date: sentDate,
          topic: message['topic'],
          payload: message['payloadString'],
          destinationName: message['destinationName'],
          qos: message['qos'],
        };
        father.retainedMqttMessages.unshift(msg);
      }

      if (father.updateMessages) {
        // console.log('msg:', message);
        const msg = {
          date: sentDate,
          topic: message['topic'],
          payload: message['payloadString'],
          destinationName: message['destinationName'],
          qos: message['qos'],
          retained: message['retained']
        };

        father.mqttMessages.unshift(msg);
        if (father.mqttMessages.length > father.maxlen) {
          father.mqttMessages.pop();
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  onFailure(message) {
    console.error('MQTT failure on connect');
    console.error(message);
    document['MQTT_CLIENT']['father'].status = 'failed';
  }
  onConnectionLost(responseObject) {
    const father = document['MQTT_CLIENT']['father'];
    console.error('onConnectionLost object: ', responseObject);
    if (responseObject.errorCode !== 0) {
      console.error('onConnectionLost:', responseObject.errorMessage);
    }
    father.status = 'lost';
    father.disconnects += 1;
    father.connect();
  }

  private RT = 25;

  calcHeatT(c_mA, type) {
    const heatCurve = this.heatCurves[type]
    for (let i = 0; i < (heatCurve.length - 1); i++) {
      const element = heatCurve[i];
      if (c_mA >= element[0] && c_mA < heatCurve[i + 1][0]) {
        const delta_c = c_mA - element[0]
        const step_c = heatCurve[i + 1][0] - element[0]
        const step_K = heatCurve[i + 1][1] - element[1]
        return this.RT + element[1] + ((delta_c / step_c) * step_K)
      }
    }
    return -1;
  }
  calcmAfromT(T, type) {
    const t = T - this.RT
    const heatCurve = this.heatCurves[type]
    for (let i = 0; i < (heatCurve.length - 1); i++) {
      const element = heatCurve[i];
      if (t >= element[1] && t < heatCurve[i + 1][1]) {
        const delta_t = t - element[1]
        const step_c = heatCurve[i + 1][0] - element[0]
        const step_K = heatCurve[i + 1][1] - element[1]
        return element[0] + step_c * ((delta_t / step_K))
      }
    }
    return -1;
  }

  calcUserUnit(board, dac, channel) {
    const c_mA = Math.round(this.DACnewValues[board][dac][channel] * this.userUnitsConvFactor[dac] * 1000) / 1000
    this.DACnewValuesUserUnit[board][dac][channel] = c_mA;
    if (dac == 'HEAT') {
      this.heatTempsUser[board][channel] = this.calcHeatT(c_mA, this.boardTypes[board]);
    }
    console.log(board, dac, channel, this.DACnewValuesUserUnit[board][dac][channel], this.DACnewValues[board][dac][channel], this.userUnitsConvFactor[dac]);
  }
  calcVfromUserUnit(board, dac, channel) {
    if (dac == 'HEAT') {
      const c_mA = this.calcmAfromT(this.heatTempsUser[board][channel], this.boardTypes[board])
      this.DACnewValuesUserUnit[board][dac][channel] = Math.round(c_mA * 1000) / 1000;
      this.DACnewValues[board][dac][channel] = c_mA / this.userUnitsConvFactor[dac]
    } else {
      this.DACnewValues[board][dac][channel] = this.DACnewValuesUserUnit[board][dac][channel] / this.userUnitsConvFactor[dac]
    }
  }

  // copied & modified from services.component TODO split into ng service
  getService() {
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() + 'system/services.php?service=gpiofancontrol'
      )
      .subscribe(
        (data: Object) => this.acceptService(data),
        (error) => this.gss.displayHTTPerror(error)
      );
    this.loadingText = 'Loading...';
  }
  acceptService(data: Object) {
    console.log('services:', data);
    if (data && data['services']) {
      this.services = data['services'];
      this.loadingText = '';
    } else {
      this.loadingText = 'Error, no fancontrol service.';
    }
  }

  // copied from services.component TODO split into ng service
  startService(service: string) {
    console.log('starting', service);
    this.services.forEach((serviceItem) => {
      if (serviceItem['name'] == service) {
        serviceItem['running'] = undefined;
      }
    });
    this.sendCmd(service, 'start');
  }
  stopService(service: string) {
    console.log('stopping', service);
    this.services.forEach((serviceItem) => {
      if (serviceItem['name'] == service) {
        serviceItem['running'] = undefined;
      }
    });
    this.sendCmd(service, 'stop');
  }
  enableService(service: string) {
    console.log('enabling', service);
    this.services.forEach((serviceItem) => {
      if (serviceItem['name'] == service) {
        serviceItem['onboot'] = undefined;
      }
    });
    this.sendCmd(service, 'enable');
  }
  disableService(service: string) {
    console.log('disabling', service);
    this.services.forEach((serviceItem) => {
      if (serviceItem['name'] == service) {
        serviceItem['onboot'] = undefined;
      }
    });
    this.sendCmd(service, 'disable');
  }

  sendCmd(service: String, cmd: String) {
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() +
        'system/service.php?cmd=' +
        cmd +
        '&service=' +
        service,
        this.ls_api_user,
        this.ls_api_pass,
        true
      )
      .subscribe(
        (data: Object) => this.checkSuccessOfCommand(data),
        (error) => this.gss.displayHTTPerror(error)
      );
  }
  checkSuccessOfCommand(data: Object) {
    console.log('success:', data);
    if (!data['success']) {
      alert('last command unsuccessful');
    } else {
      this.getService();
    }
  }
}
