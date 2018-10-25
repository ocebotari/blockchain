import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

//import {UtilModule} from '../util/util.module';
import {
   MatButtonModule,
   MatCardModule,
   MatFormFieldModule,
   MatInputModule,
   MatSelectModule, 
   MatSnackBarModule,
   MatListModule,
   MatProgressSpinnerModule,
   MatTableModule,
   MatExpansionModule
} from '@angular/material';
//import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { AccountService } from '../account/account.service';
import { ConferenceService } from '../conference.service';
import { TokenService} from '../token.service';

import { ConfListComponent } from './conf-list/conf-list.component';
import {ConfDetailsComponent} from './conf-details/conf-details.component';
import { ConfRoutingModule } from './conf-routing.module';


@NgModule({
  imports: [
    //BrowserAnimationsModule,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    //UtilModule,
    ConfRoutingModule
  ],
  declarations: [
    ConfDetailsComponent,
    ConfListComponent
  ],
  providers: [ AccountService, ConferenceService, TokenService ]
})
export class ConfModule {
}