import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {
    MatToolbarModule,
    MatIconModule,
    MatGridListModule,
    MatListModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatStepperModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule
  } from '@angular/material';

import { WalletComponent, WalletComponentSendDialog, WalletComponentAccountDetailsDialog } from './wallet.component';
import { WalletRoutingModule } from './wallet-routing.module';
import { WalletService } from './wallet.service';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatIconModule,
    MatGridListModule,
    MatListModule,
    MatButtonModule,
    MatChipsModule,
    WalletRoutingModule,
    MatDialogModule,
    MatStepperModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule
  ],
  providers:[WalletService],
  entryComponents: [WalletComponent, WalletComponentSendDialog, WalletComponentAccountDetailsDialog],
  declarations: [WalletComponent, WalletComponentSendDialog, WalletComponentAccountDetailsDialog]
})
export class WalletModule { }
