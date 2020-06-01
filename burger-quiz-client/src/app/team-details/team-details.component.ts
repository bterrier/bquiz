import { Component, OnInit } from '@angular/core';

interface Player {
  name: string;
  isLead: boolean;
  isMe: boolean;
  answer: string;
}

@Component({
  selector: 'app-team-details',
  templateUrl: './team-details.component.html',
  styleUrls: ['./team-details.component.css']
})
export class TeamDetailsComponent implements OnInit {

  teamName: string ='<teamName>';
  players: Player[] = [ { name: "chief", isLead: true, isMe: false, answer: "A" },
  { name: "Mario", isLead: false, isMe: true, answer: "A" },
  { name: "summy", isLead: false, isMe: false, answer: "" }];

  constructor() { }

  ngOnInit(): void {
  }

}
