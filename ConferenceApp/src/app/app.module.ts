import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { Router } from '@angular/router';

import {UtilModule} from './util/util.module';

import { LoginRoutingModule }      from './login-routing.module';
import { LoginComponent }          from './login.component';

import { AppComponent } from './app.component';

import { ConfModule } from './conference/conf.module';
import { AppRoutingModule }     from './app-routing.module';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatToolbarModule,
  //MatTabsModule,
  MatListModule,
  MatIconModule,
  //MatExpansionModule
} from '@angular/material';
import { WalletModule } from './wallet/wallet.module';
import { HttpClientModule } from '@angular/common/http';
import { Globals } from './globals';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent
    
  ],
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    // MatTabsModule,
    MatListModule,
    MatIconModule,
    //MatExpansionModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    HttpClientModule,
    ConfModule,
    LoginRoutingModule,
    WalletModule,
    UtilModule,
    AppRoutingModule
  ],
  providers: [HttpClientModule, Globals],
  bootstrap: [AppComponent]
})
export class AppModule { 
    constructor(router: Router) {
        console.log('Routes: ', JSON.stringify(router.config, undefined, 2));
      }
}
