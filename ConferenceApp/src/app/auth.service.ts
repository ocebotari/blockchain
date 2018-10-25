import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/observable';
import { of } from 'rxjs/observable/of';
import { tap, delay } from 'rxjs/operators';
import { AccountService, AccountModel } from './account/account.service';

@Injectable()
export class AuthService {
  isLoggedIn = false;
  isAdmin = false;
  loggedUser:AccountModel;

  // store the URL so we can redirect after logging in
  redirectUrl: string;

  constructor(public accountService: AccountService) {
  }

  login(address): Observable<boolean> {
    this.accountService.getAccount(address).subscribe(user =>{
        if (user) {
            this.isLoggedIn = true;
            this.isAdmin = this.accountService.isAdmin(user.address);
            this.loggedUser = user;
            console.log("current user");
            console.log(user);
            localStorage.setItem("currentUser",  JSON.stringify(user))
            console.log("Set user to storage");
        }
    });

    return of(true);
    // return of(true).pipe(        
    //   delay(1000),
    //   tap(val => this.isLoggedIn = true)
    // );
  }

  logout(): void {
    this.isLoggedIn = false;
    this.isAdmin = false;
    localStorage.removeItem("currentUser");
  }

  getUserFromStorage(): AccountModel {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if(user)
        return new AccountModel(user.address, user.publicKey, user.privateKey, user.firstName, user.lastName);
    else return null;
  }
}


/*
Copyright 2017-2018 Google Inc. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/