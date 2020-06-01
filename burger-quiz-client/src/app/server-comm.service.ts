import { Injectable } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { QWebChannel } from './shared/qwebchannel'
@Injectable({
  providedIn: 'root'
})
export class ServerCommService {
  private channel: QWebChannel;
  private socket: WebSocket;
  private client: any;

  private partyId: string;
  private teamId: string;
  private playerId :string;
  constructor(private route: ActivatedRoute) { 
    const map = this.route.snapshot.queryParamMap; 
    this.partyId = map.get('party');
    this.teamId = map.get('team');

    this.route.queryParams.subscribe(params => {
      this.partyId = params['party'];
      this.teamId = params['team'];
    });

    this.socket = new WebSocket("ws://localhost:8081/");
    this.socket.onopen = () => {
      this.channel = new QWebChannel(this.socket, ()=>{
        this.client = this.channel.objects['client'];
        this.client.join(this.partyId, this.teamId);
      });
    };
    this.socket.onerror = (ev: Event) => {
      console.log(ev);
    };


    this.socket.onclose = (ev: Event) => {
      console.log(ev);
    };
  }
}
