import { Component } from '@angular/core';

@Component({
  template:  `
    <mat-nav-list>
      <a mat-list-item routerLinkActive="active" routerLink="./"
        [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
      <a mat-list-item routerLinkActive="active" routerLink="./tokens">Manage tokens</a>        
      <a mat-list-item routerLinkActive="active" routerLink="./conferences">Manage conferences</a>
    </mat-nav-list>
    <!-- <nav>
      <a routerLink="./" routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
      
    </nav>-->
    <router-outlet></router-outlet>
  `,
  styleUrls:['./admin.component.css']
})
export class AdminComponent {
    address: string;
}

/*
<a routerLink="../token/token" routerLinkActive="active">Manage OTH</a>
      <a routerLink="../conferences" routerLinkActive="active">Manage Conference</a>
/*
Copyright 2017-2018 Google Inc. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/