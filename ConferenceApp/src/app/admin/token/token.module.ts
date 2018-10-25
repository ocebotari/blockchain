import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//import {UtilModule} from '../../util/util.module';
import { TokenRoutingModule } from './token-routing.module';
import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  //MatOptionModule,
  MatTableModule,
  MatSelectModule, 
  MatSnackBarModule,
  MatExpansionModule,
  MatProgressSpinnerModule,
  MatRadioModule
} from '@angular/material';
//import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { AccountService } from '../../account/account.service';
import { TokenService } from '../../token.service';

import {TokenDetailsComponent} from './oth-details/oth-details.component';
import {TokenMintComponent} from './token-mint/token-mint.component';
import {TokenSenderComponent} from './token-sender/token-sender.component';
import { TokenListComponent } from './token-list/token-list.component';
import { TokenCreateComponent } from './token-create.component';

@NgModule({
  imports: [
    //BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    //MatOptionModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    //UtilModule,
    TokenRoutingModule
  ],
  declarations: [
    TokenDetailsComponent, 
    TokenSenderComponent, 
    TokenListComponent,
    TokenMintComponent,
    TokenCreateComponent
  ],
  providers: [ AccountService, TokenService ]
})
export class TokenModule {
}
