import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NuggetsLiteComponent } from './nuggets-lite/nuggets-lite.component'
import { PageNotFoundComponent } from './page-not-found/page-not-found.component'

const routes: Routes = [
  { path: 'game/:id', component: NuggetsLiteComponent },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
