import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ConferenceService, ConferenceModel } from '../../conference.service';
import { AccountModel, AccountService } from '../../account/account.service';
import { TokenService } from '../../token.service';
import { Observable } from 'rxjs';

declare let require: any;
const conf_artifacts = require('../../../../build/contracts/Conference.json');

@Component({
    template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>New Conference</mat-card-title>
        <mat-card-subtitle>Create Conference Contract with the following parameters</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="flex-container">
            <mat-form-field>
                <input type="text" placeholder="Title" matInput (input)="model.title = $event.target.value" [(value)]="model.title" required>
                <mat-hint>fancy name: eg Event 1 </mat-hint>
            </mat-form-field>  
            <mat-form-field>
                <textarea matInput placeholder="Descriptions" (change)="model.descriptions = $event.target.value">{{model.descriptions}}</textarea>
                <mat-hint>short descriptions</mat-hint>
            </mat-form-field>
            <mat-form-field>
                <input type="text" matInput placeholder="Organizer" (input)="model.organizer = $event.target.value"
                #message maxlength="256" [(value)]="model.organizer" required>
                <mat-hint align="start">Organizer of conferemce</mat-hint>
                <mat-hint align="end">{{message.value.length}} / 256</mat-hint>
            </mat-form-field>
            <mat-form-field>
                <mat-select (change)="model.token = $event.value"  [(value)]="model.token" placeholder="Select token address">
                    <mat-option *ngFor="let token of tokens$ | async" [value]="token.address">
                        {{ token.address }}
                    </mat-option>
                </mat-select>
                <mat-hint>token address: eg 0x783acc26</mat-hint>
            </mat-form-field>
            <div class="flex-row">
                <mat-form-field>
                    <input matInput [matDatepicker]="picker1" placeholder="Start Date"  [(value)]="model.sDate" (dateInput)="model.sDate = $event.value">
                    <mat-datepicker-toggle matSuffix [for]="picker1"></mat-datepicker-toggle>
                    <mat-datepicker #picker1></mat-datepicker>
                </mat-form-field>
                <mat-form-field class="two-digit-field">
                    <input type="number" matInput min="0" max="23" [(value)]="shours" 
                        (input)="shours = $event.target.value" placeholder="hh">
                </mat-form-field>
                <mat-form-field class="two-digit-field">
                    <input type="number" matInput min="0" max="59" [(value)]="sminutes" 
                        (input)="sminutes = $event.target.value" placeholder="mm">
                </mat-form-field>
            </div>
            <div class="flex-row">
                <mat-form-field>
                    <input matInput [matDatepicker]="picker2" placeholder="End Date" [(value)]="model.eDate" (dateInput)="model.eDate = $event.value">
                    <mat-datepicker-toggle matSuffix [for]="picker2"></mat-datepicker-toggle>
                    <mat-datepicker #picker2></mat-datepicker>
                </mat-form-field>
                <mat-form-field class="two-digit-field">
                    <input type="number" matInput min="0" max="23" [(value)]="ehours" 
                        (input)="ehours = $event.target.value" placeholder="hh">
                </mat-form-field>
                <mat-form-field class="two-digit-field">
                    <input type="number" matInput min="0" max="59" [(value)]="eminutes" 
                        (input)="eminutes = $event.target.value" placeholder="mm">
                </mat-form-field>
            </div>
            <mat-form-field class="number-field">
                <input type="number" matInput min="0"  [(value)]="model.numVotTokens" (input)="model.numVotTokens = $event.target.value" placeholder="Default count of votes per attendee">
            </mat-form-field>
            <mat-form-field class="number-field">
                <input type="number" matInput min="0" [(value)]="model.maxAttendees" (input)="model.maxAttendees = $event.target.value" placeholder="Maximum number of attendees" required>
                <mat-hint>should be greater then 0.</mat-hint>
            </mat-form-field>
            <mat-form-field>
                <input type="number" min="0" max="2" step="0.1" placeholder="Voucher Discount Decimals" matInput id="decimals" [(value)]="model.voucherDiscountDecimals" (input)="model.voucherDiscountDecimals = $event.target.value">
                <mat-hint>How many decimals to show: eg 1.5</mat-hint>
            </mat-form-field>
            <mat-form-field>
                <input type="text" matInput placeholder="Image path" [(value)]="model.image" (input)="model.image = $event.target.value">
                <mat-hint>event picture path</mat-hint>
            </mat-form-field>
        </div>
      </mat-card-content>
      <mat-card-actions>
        <p> 
            <mat-spinner class="fl" *ngIf="loading" diameter="20"></mat-spinner>
            <button mat-raised-button (click)="onCreate()" [disabled]="loading" *ngIf="!model.isValid">{{ !loading ? 'Create' : 'Creating' }}</button>
            <button mat-raised-button routerLink="../">Back</button>
        </p>
      </mat-card-actions>
    </mat-card>`,
    styles:[`
        .flex-row {
            display: flex;
            flex-direction: row;
        }

        .two-digit-field {
            width: 40px;
        }

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
export class ConferenceCreateComponent implements OnInit {
    currentUser: AccountModel;
    Conference: any;
    model: ConferenceModel = new ConferenceModel();
    shours = 0;
    sminutes = 0;

    ehours = 0;
    eminutes = 0;

    tokens$: Observable<any>;
    loading = false;

    constructor(private web3Service: Web3Service, 
        private confService: ConferenceService, 
        private accountService: AccountService,
        private tokenService: TokenService,
        private matSnackBar: MatSnackBar,
        private route: ActivatedRoute,
        private router: Router) {
        console.log('Constructor(web3Service): ' + web3Service);
        console.log('Constructor(confService): ' + confService);
    }
    
    ngOnInit(): void {
        console.log('OnInit: ' + this.web3Service);
        console.log(this);                

        this.currentUser = this.accountService.getCurrentUser();
        this.tokens$ = this.tokenService.getTokens();
        this.model.voucherDiscountDecimals = 2;
        this.shours = this.model.sDate.getHours();
        this.sminutes = this.model.sDate.getMinutes();
        this.ehours = this.model.eDate.getHours();
        this.eminutes = this.model.eDate.getMinutes();

        this.web3Service.artifactsToContract(conf_artifacts).then((confAbstraction) => {
            this.Conference = confAbstraction;
        });
    }

    setStatus(status) {
        this.matSnackBar.open(status, null, {duration: 3000});
    }

    isValid(){
        if(this.model.token == ""){
            this.setStatus("Token is required.");
            return false;        
        }

        if(this.model.title == ""){
            this.setStatus("Title is required.");
            return false;        
        }

        if(this.model.organizer == ""){
            this.setStatus("Organazer is required.");
            return false;        
        }
    
        if(this.model.maxAttendees == 0){
            this.setStatus("Max number of attendee slots should be greater then 0.");
            return false;        
        }

        if(!this.model.sDate){
            this.setStatus("Start date is required");
            return false;        
        }

        if(!this.model.eDate){
            this.setStatus("End date is required.");
            return false;        
        }
    
        return true;
    }

    onChangeDate(e) {
        console.log(e);
    }

    async create() {
        console.log('Create conference');
    
        try {
   
            this.model.sDate.setHours(this.shours, this.sminutes);
            this.model.eDate.setHours(this.ehours, this.eminutes);

            const sdate = this.model.sDate.getTime() / 1000;
            const edate = this.model.eDate.getTime() / 1000;
            this.model.created = new Date();
            this.model.createdBy =  this.currentUser.address;
            
            const conf = await this.Conference.new(sdate, 
                                                    edate,
                                                    this.model.token, 
                                                    this.model.maxAttendees,                                                      
                                                    this.model.numVotTokens, 
                                                    this.model.voucherDiscountDecimals, 
                                                    { from: this.currentUser.address, gas: 6000000 });

            console.log(conf);
    
            this.confService.add(conf.address, this.model.title, this.model.descriptions, this.model.organizer, this.model.image, this.model.created, this.model.createdBy);
    
            return conf;
    
        } catch (e) {
            console.log(e);
            this.setStatus('Error getting token details; see log.');
        }
      }
    
    onCreate(){
        if(!this.isValid()){
          return;   
        }
  
        this.loading = true;

        this.create().then((t) => {
            if (!t) {
                this.setStatus('Transaction failed!'); 
                this.loading = false;
                return false;          
            } else {
                this.setStatus('Transaction submitted! Wait the block');
                console.log("Wait mine the block");
                this.web3Service.waitBlock(t.transactionHash).catch(function(){ this.loading = false; }).then(() => {
                    this.loading = false;
                    this.router.navigate(['details', t.address], {relativeTo: this.route.parent});
                });
            }        
        })
    }
}