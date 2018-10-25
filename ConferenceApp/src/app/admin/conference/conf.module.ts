import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//import {UtilModule} from '../../util/util.module';
import {
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule, 
    MatSnackBarModule,
    MatListModule,
    MatTableModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule
} from '@angular/material';
//import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {ConfDetailsComponent} from './conf-details/conf-details.component';
import { ConfListComponent } from './conf-list/conf-list.component';
import { ConfRoutingModule } from './conf-routing.module';
import { ConferenceCreateComponent } from './conference-create.component';

import { AccountService } from '../../account/account.service';
import { ConferenceService } from '../../conference.service';
import { TokenService } from '../../token.service'; 

@NgModule({
  imports: [
    //BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatListModule,
    MatExpansionModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    //UtilModule,
    ConfRoutingModule
  ],
  declarations: [
    ConfDetailsComponent,
    ConfListComponent,
    ConferenceCreateComponent
  ],
  providers: [ AccountService, ConferenceService, TokenService ]
})
export class AdminConfModule {
}