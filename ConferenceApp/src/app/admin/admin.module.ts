import { NgModule }       from '@angular/core';
import { CommonModule }   from '@angular/common';
import {
    // MatButtonModule,
    // MatCardModule,
    // MatFormFieldModule,
    // MatInputModule,
    // MatOptionModule,
    // MatSelectModule, 
    // MatSnackBarModule,
    // MatTabsModule,
     MatListModule,
    // MatTableModule,
    // MatExpansionModule,
    // MatIconModule
  } from '@angular/material';

import { AdminComponent }           from './admin.component';
import { AdminDashboardComponent }  from './admin-dashboard.component';
//import { ManageTokenComponent }    from './manage-token.component';
//import { ManageConferencesComponent }    from './manage-conferences.component';
import {TokenModule} from './token/token.module';
import {AdminConfModule} from './conference/conf.module';

//import { TokenRoutingModule } from './token/token-routing.module';
//import { ConfRoutingModule } from './conference/conf-routing.module';
import { AdminRoutingModule }       from './admin-routing.module';

@NgModule({
  imports: [
    CommonModule,
    // MatButtonModule,
    // MatCardModule,
    // MatFormFieldModule,
    // MatInputModule,
    // MatOptionModule,
    // MatSelectModule,
    // MatSnackBarModule,
    // MatTableModule,
    // MatTabsModule,
     MatListModule,
    // MatIconModule,
    // MatExpansionModule,
    //TokenRoutingModule,
    //ConfRoutingModule,
    AdminRoutingModule,
    TokenModule,
    AdminConfModule
  ],
  declarations: [
    AdminComponent,
    AdminDashboardComponent,
    //ManageTokenComponent,
    //ManageConferencesComponent
  ],
  exports: [
    AdminDashboardComponent//,
    //ManageTokenComponent,
    //ManageConferencesComponent
  ]
})
export class AdminModule {}


/*
Copyright 2017-2018 Google Inc. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/