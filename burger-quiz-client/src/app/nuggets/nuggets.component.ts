import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-nuggets',
  templateUrl: './nuggets.component.html',
  styleUrls: ['./nuggets.component.css']
})
export class NuggetsComponent implements OnInit {

  constructor() { }
  answer: string = '';
  answerText: string[] = [ 'Bla', 'Blabla', "bla bla bla", 'bla bla bla bla'];
  questionText: string = 'Bla bla bla?';
  ngOnInit(): void {
  }

}
