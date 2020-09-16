import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

import * as Paho from 'paho-mqtt';
import { GlobalSettingsService } from './global-settings.service';

@Injectable({
  providedIn: 'root',
})
export class MqttService {
  /*
    loaded on 'boot'
      connect to broker

      users can subscribe to a topic, and get pushed the messages
  */

  private emitChangeSources = {};
  public observableTopics$ = {};

  private client;
  private clientID = 'ng-unrvl_' + String(Math.random() * 100);
  public status = 'init'; // | connecting | connected | failed | lost
  public disconnects = 0;

  private timeoutcounter = 0;

  private sampleRequestObject = {
    topic: '+/sensors/+/temperature',
    tagFilters: { key1: 'value1', key2: 'value2' }, // TODO implement
    valueFilters: ['air_degC', 'probe_degC'], // TODO implement
    callBack: (obj: Object) => this.demo(obj),
  };
  demo(obj: Object) {}
  private waitingRequests = [];
  private activeRequesters = [];
  private topicSubscribers = { sampleTopic: 0 };

  constructor(private globalSettings: GlobalSettingsService) {
    let server = this.globalSettings.server.serverName;
    if (server) {
      this.init();
    } else {
      console.log('mqtt: server not ready yet');
      setTimeout(
        function () {
          this.init();
        }.bind(this),
        50
      );
    }
  }
  private init() {
    let server = this.globalSettings.server.serverName;
    if (!server) {
      console.log('mqtt: server not ready yet');
      setTimeout(
        function () {
          this.init();
        }.bind(this),
        50 + (this.timeoutcounter += 10)
      );
      return;
    }

    console.log('mqtt server:' + server);

    this.client = new Paho.Client(server, 1885, this.clientID);
    this.client.onConnectionLost = (obj: Object) => this.onConnectionLost(obj);
    this.client.onMessageArrived = (obj: Object) => this.onMessageArrived(obj);
    console.log('MQTT client under construction', this.client);
    this.connect();
  }
  public reload() {
    this.init();
  }

  public request(requestObject: Object) {
    const topic = requestObject['topic'];
    if (!topic) {
      console.error('mqtt.request: no topic ');
      return undefined;
    }
    if (!this.emitChangeSources[topic]) {
      this.emitChangeSources[topic] = new Subject<any>();
      this.observableTopics$[topic] = this.emitChangeSources[
        topic
      ].asObservable();
    }

    if (this.status === 'connected') {
      this.subscribe(requestObject);
    } else {
      console.log(
        'not connected yet, put ' + requestObject['topic'] + ' into queue.'
      );
      this.waitingRequests.push(requestObject);
    }

    return this.observableTopics$[topic].subscribe(requestObject['callBack']);
  }
  public unsubscribeTopic(topic: string) {
    console.log(
      'unsubscribing from ',
      topic,
      'count',
      this.topicSubscribers[topic]
    );
    if (!this.client) {
      console.error('no client');
      return;
    }
    if (!this.topicSubscribers[topic] || !(this.topicSubscribers[topic] > 0)) {
      console.error('unsubscribing to a topic no longer existing');
      return;
    }
    this.topicSubscribers[topic] -= 1;
    if (this.topicSubscribers[topic] == 0) {
      console.log('subscribers to ' + topic + ' down to 0, unsubscribe');
      this.client.unsubscribe(topic, {});
    }
  }
  private subscribe(requestObject: Object) {
    const topic = requestObject['topic'];
    console.log('subscribing to', topic);
    this.client.subscribe(topic);
    this.activeRequesters.push(requestObject);
    if (this.topicSubscribers[topic]) {
      this.topicSubscribers[topic] += 1;
    } else {
      this.topicSubscribers[topic] = 1;
    }
  }

  private connect() {
    this.client.connect({
      onSuccess: () => this.onConnect(),
      onFailure: (obj: Object) => this.onFailure(obj),
    });
    this.status = 'connecting';
  }
  private onConnect() {
    console.log('onConnect');
    this.status = 'connected';

    // here to avoid circular dependency with GlobalSettingsService
    this.request(this.networkMqttRequest);

    while (this.waitingRequests.length) {
      let request = this.waitingRequests.pop();
      console.log('handle waiting subscribing', request['topic']);
      this.subscribe(request);
    }
    if (this.disconnects > 0) {
      this.activeRequesters.forEach((req) => {
        this.client.subscribe(req.topic);
      });
    }
  }
  private onFailure(message) {
    console.error('MQTT failure on connect');
    console.error(message);
    this.status = 'failed';
  }
  private onConnectionLost(responseObject) {
    console.error('onConnectionLost object: ', responseObject);
    if (responseObject.errorCode !== 0) {
      console.error('onConnectionLost:', responseObject.errorMessage);
    }
    this.status = 'lost';
    this.disconnects += 1;
    this.connect();
  }
  private onMessageArrived(message: Object) {
    // console.log(
    //   'topic:' + message['topic'] + ' payload: ' + message['payloadString']
    // );
    const topic = message['topic'];
    const payLoadObj = JSON.parse(message['payloadString']);
    payLoadObj.topic = topic;
    const sensor = topic.match(/sensors\/(.*)\//) || [];
    if (sensor.length > 1 && payLoadObj['tags']) {
      payLoadObj.tags.sensor = sensor[1];
    }

    const keys = Object.keys(this.emitChangeSources);
    let found = false;
    for (let i = 0; i < keys.length; i++) {
      const element = keys[i];
      // console.log('subscriber:', element);

      if (this.compareTopics(element, topic)) {
        // TODO implement filters
        this.emitChangeSources[element].next(payLoadObj);
        found = true;
      }
    }
    if (!found) {
      console.error('no topic subscribers found for', topic);
    }
  }
  public compareTopics(subscribedTopic: string, receivedTopic: string) {
    if (subscribedTopic === '#') {
      return true;
    }
    const subscribedArray = subscribedTopic.split('/');
    const receivedArray = receivedTopic.split('/');
    for (let i = 0; i < subscribedArray.length; i++) {
      const subscribedPart = subscribedArray[i];
      const receivedPart = receivedArray[i];
      if (!receivedPart) {
        console.log('mqtt.compareTopics: received part shorter than subscribe');
        return false;
      }
      if (subscribedPart == '+' || subscribedPart === receivedPart) {
        continue;
      }

      // not matched
      return false;
    }
    if (receivedArray.length > subscribedArray.length) {
      console.error(
        'mqtt.compareTopics: unknown situation',
        receivedArray,
        subscribedArray
      );
      return false;
    }

    // every part matched
    // console.log('matched', subscribedTopic, receivedTopic);
    return true;
  }

  // here to avoid circular dependency with GlobalSettingsService
  private networkMqttRequest = {
    topic: '+/system/network',
    tagFilters: undefined,
    valueFilters: [],
    callBack: (obj: Object) => this.updateNetWork(obj),
  };
  updateNetWork(msg: Object) {
    if (msg['interfaces']) {
      this.globalSettings.networkStatus = msg['interfaces'];
    } else {
      console.error('mqtt system/network: no valid data', msg);
    }
  }
}
