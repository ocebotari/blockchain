import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminComponent }           from './admin.component';
import { AdminDashboardComponent }  from './admin-dashboard.component';
//import { ManageTokenComponent }    from './manage-token.component';
//import { ManageConferencesComponent }    from './manage-conferences.component';
//import { TokenListComponent } from './token/token-list/token-list.component';
//import { ConfListComponent } from './conference/conf-list/conf-list.component';

//import { TokenModule } from './token/token.module';
//import { ConfModule } from './conference/conf.module';

import { AuthGuard } from '../auth-guard.service';

const adminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        canActivateChild: [AuthGuard],
        children: [
          { path: 'tokens', loadChildren: './token/token.module#TokenModule' }, // component: TokenListComponent },
          { path: 'conferences', loadChildren: './conference/conf.module#AdminConfModule' }, // component: ConfListComponent },
          { path: '', component: AdminDashboardComponent }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(adminRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class AdminRoutingModule {}


/*
Copyright 2017-2018 Google Inc. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/