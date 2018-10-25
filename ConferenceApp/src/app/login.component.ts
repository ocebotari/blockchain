import { Component }        from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { AuthService }      from './auth.service';
import {FormGroup, FormControl, Validators} from '@angular/forms';

@Component({
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>LOGIN</mat-card-title>
        <mat-card-subtitle><p>{{message}}</p></mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        
        <div [formGroup]="form" >
            <p>
                <mat-form-field class="address-field" *ngIf="!authService.isLoggedIn">
                    <input type="text" placeholder="Address" matInput id="address" [(value)]="address" (change)="setAddress($event)" formControlName="addressControl" required>
                    <mat-error *ngIf="addressControl.invalid">{{getErrorMessage()}}</mat-error>
                </mat-form-field>
            </p>     
        </div>
      </mat-card-content>
      <mat-card-actions>
        <p>
        <button mat-raised-button (click)="login()"  *ngIf="!authService.isLoggedIn">Login</button>
        <button mat-raised-button (click)="logout()" *ngIf="authService.isLoggedIn">Logout</button>
        </p>
      </mat-card-actions>
    </mat-card>`,
  styles:[`  
    .address-field {
      width: 400px;
    }
  `]

})
export class LoginComponent {
  message: string;
  address: string = "0x2205c02320d9ee8cf79afa6dca823b2c46399884";
  disabled = false;
  
  form = new FormGroup({
    addressControl: new FormControl('', [Validators.required])
  });
  get addressControl(): any { return this.form.get('addressControl'); }

  constructor(public authService: AuthService, public router: Router) {
    this.setMessage();
  }

  setMessage() {
    this.message = 'Logged ' + (this.authService.isLoggedIn ? 'in' : 'out');
  }

  setAddress(e){
      this.address = e.target.value;
  }

  getErrorMessage() {
    return this.addressControl.hasError('required') ? 'You must enter a value' : '';
  }

  login() {
    this.message = 'Trying to log in ...';

    if(this.address.length == 0){
        this.message = 'You must enter a value';
        return;
    }

    this.authService.login(this.address).subscribe(() => {
      this.setMessage();
      if (this.authService.isLoggedIn) {
        // Get the redirect URL from our auth service
        // If no redirect has been set, use the default
        //this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        let redirect = this.authService.redirectUrl ? this.authService.redirectUrl : '/conferences';

        // Set our navigation extras object
        // that passes on our global query params and fragment
        let navigationExtras: NavigationExtras = {
          queryParamsHandling: 'preserve',
          preserveFragment: true
        };

        // Redirect the user
        this.router.navigate([redirect], navigationExtras);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.setMessage();
  }
}


/*
Copyright 2017-2018 Google Inc. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/