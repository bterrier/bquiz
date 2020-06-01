import { Component, OnInit, HostListener } from '@angular/core';
import { LiteComService } from '../lite-com.service';
import { Subscription } from 'rxjs';

import { ActivatedRoute } from '@angular/router';

export enum KEY_CODE {
  RIGHT_ARROW = 39,
  LEFT_ARROW = 37,
  Numpad1 = 97,
  Numpad2 = 98,
  Numpad3 = 99
}

@Component({
  selector: 'app-nuggets-lite',
  templateUrl: './nuggets-lite.component.html',
  styleUrls: ['./nuggets-lite.component.css']
})
export class NuggetsLiteComponent implements OnInit {

  answer: string = '';
  spAnswer: string = '';
  private sub: Subscription;
  constructor(private service: LiteComService, private route: ActivatedRoute) { 
    this.sub = service.event.subscribe((message: string)=>{
      console.log('event:' + message);
     this.answer = message;});
  }

  ngOnInit(): void {
    
    this.route.params.subscribe(params => {
      this.service.id = params['id'];
    });
  }

  selectAnswer(a:string) {
    this.service.selectAnswer(a);
  }

  selectSPAnswer(answer: string) {
    this.service.selectSPAnswer(answer);
  }

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key === "1") {
      this.selectSPAnswer("A");      
    } else if (event.key === "2") {
      this.selectSPAnswer("B");
    } else if (event.key === "3") {
      this.selectSPAnswer("Both");
    }

  }

}
