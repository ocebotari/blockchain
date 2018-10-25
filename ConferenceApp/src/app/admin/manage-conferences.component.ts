import { Component, OnInit }    from '@angular/core';
import { ActivatedRoute }       from '@angular/router';
import { Observable }           from 'rxjs';
import { of }           from 'rxjs/observable/of';
import { map }                  from 'rxjs/operators';
import { AccountModel } from '../account/account.service';

@Component({
  template:  `
    <p>Manage your conferences here</p>

    <p>Session ID: {{ sessionId | async }}</p>
    <a id="anchor"></a>
    <p>Token: {{ token | async }}</p>
    <p *ngIf="currentUser | async as user">Current User: {{ user.fullName() }}</p>
  `
})
export class ManageConferencesComponent implements OnInit {
    sessionId: Observable<string>;
    token: Observable<string>;
    currentUser: Observable<AccountModel>;

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        // Capture the session ID if available
        this.sessionId = this.route
            .queryParamMap
            .pipe(map(params => params.get('session_id') || 'None'));

        // Capture the fragment if available
        this.token = this.route
            .fragment
            .pipe(map(fragment => fragment || 'None'));

        const user = JSON.parse(localStorage.getItem('currentUser'));
        this.currentUser = of(new AccountModel(user.address, user.publicKey, user.privateKey, user.firstName, user.lastName));
    }
}


/*
Copyright 2017-2018 Google Inc. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/