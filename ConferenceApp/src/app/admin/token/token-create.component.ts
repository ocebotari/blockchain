import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { TokenModel, TokenService } from '../../token.service';
import { AccountModel, AccountService } from '../../account/account.service';

declare let require: any;
const oth_artifacts = require('../../../../build/contracts/OTH.json');

@Component({
    template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Create Token</mat-card-title>
        <mat-card-subtitle>Create Token Contract with the following parameters</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        
      <div class="flex-container">
      <mat-form-field>
          <input type="text" placeholder="Name" matInput (input)="model.name = $event.target.value" autocomplete="Off" required>
          <mat-hint>fancy name: eg Simon Bucks</mat-hint>
      </mat-form-field>  
      <p></p>          
      <mat-form-field>
          <input type="number" placeholder="Decimals" matInput id="decimals" (input)="model.decimals = $event.target.value" required>
          <mat-hint>How many decimals to show: eg 18</mat-hint>
      </mat-form-field>
      <p></p>
      <mat-form-field>
          <input type="text" matInput id="symbol" placeholder="Symbol" (input)="model.symbol = $event.target.value" autocomplete="Off" required>
          <mat-hint>An identifier: eg SBX</mat-hint>
      </mat-form-field>
  </div>
      </mat-card-content>
      <mat-card-actions>
        <p>
            <mat-spinner class="fl" *ngIf="loading" diameter="20"></mat-spinner>
            <button mat-raised-button (click)="createToken()" *ngIf="!model.isValid"
             [disabled]="loading">{{ !loading ? 'Create' : 'Creating' }}</button>
            <button mat-raised-button routerLink="../../">Back</button>
        </p>
      </mat-card-actions>
    </mat-card>`,
    styles:[`
        .flex-container {
            display: flex;
            flex-direction: column;
            margin: 1em 0;
        }
        
        .flex-container > * {
            width: 100%;
        }

        .fl {
            float: left;
        }
    `]
})
export class TokenCreateComponent implements OnInit {
  OTH: any;
  currentUser: AccountModel;
  model: TokenModel = new TokenModel();
  loading = false;
  status = '';

  constructor(private web3Service: Web3Service, 
    private matSnackBar: MatSnackBar, 
    private accountService: AccountService,
    private tokenService: TokenService,
    private route:ActivatedRoute,
    private router: Router) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit(): void {
    console.log('OnInit: ' + this.web3Service);
    console.log(this);

    this.currentUser = this.accountService.getCurrentUser();
    console.log(oth_artifacts);
    this.web3Service.artifactsToContract(oth_artifacts).then((OTHAbstraction) => {        
        this.OTH = OTHAbstraction;
      });
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  isValid(){
    if(this.model.name == ""){
        this.setStatus("Name is required.");
        return false;        
    }

    if(this.model.symbol == ""){
        this.setStatus("Symbol is required.");
        return false;        
    }

    return true;
  }

  async createToken(){
      if(!this.isValid()){
        return;   
      }
      this.loading = true;

      this.setStatus('Initiating transaction... (please wait)');
    //   let balance = await this.getBalance(this.currentUser.address);
    //   if(balance === "0"){
    //     this.loading = false;
    //     return;
    //   }    

      await this.create().then((t) => {
        if (!t) {
            this.setStatus('Transaction failed!'); 
            this.loading = false;
            return false;          
        } else {
            this.setStatus('Transaction submitted!');
            console.log("Wait block");
            //console.log(t);
            this.web3Service.waitBlock(t.transactionHash).catch(e => { this.loading = false; }).then(() => {
                this.router.navigate([t.address], {relativeTo: this.route.parent});
            });     
        }   
      })
  }

  async create() {
    console.log('Create token');

    try {

        const token = await this.OTH.new(this.model.name, this.model.decimals, this.model.symbol, { from: this.currentUser.address, gas: 6000000 });

        this.tokenService.addToken(token.address, new Date(), this.currentUser.address);

        return token;

    } catch (e) {
        console.log(e);
        this.setStatus('Error creating new token; see log.');
    }
  }

  async getBalance(address) {
    this.setStatus('Initiating transaction... (please wait)');
    return await this.web3Service.getBalance(address, (err, balance) => {
        if(err != null){
          console.log(err);
          this.setStatus('Error getting sender balance; see log');
          return;
        }

        if(balance === "0"){
          console.log("Balance is 0 for account: " + this.currentUser.fullName());
          this.setStatus('Insufficient amount on the sender account');
          return;
        }
    });
  }
}

