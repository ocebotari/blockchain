import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../auth-guard.service';
import { ConfDetailsComponent } from './conf-details/conf-details.component';
import { ConfListComponent } from './conf-list/conf-list.component';

const confsRoutes: Routes = [
  { path: 'conferences', 
  //canActivate: [AuthGuard], 
  component: ConfListComponent },
  { path: 'conferences/:id', 
  canActivate: [AuthGuard], 
  component: ConfDetailsComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(confsRoutes)
  ],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class ConfRoutingModule { }
