import {Component, OnInit} from '@angular/core';
import { switchMap } from 'rxjs/operators';
import {Web3Service} from '../../util/web3.service';
import { MatSnackBar } from '@angular/material';
import {  ActivatedRoute, ParamMap } from '@angular/router';

import { ConferenceModel, ConferenceService, ConferenceEntity, Voucher } from '../../conference.service';
import { AccountModel, AccountService, VoteReceived, Speaker, Attendee } from '../../account/account.service';
import { Observable } from 'rxjs';
import { of } from 'rxjs/observable/of';
import { Utilities } from '../../util/utilities';
import { TokenService } from '../../token.service';

declare let require: any;
const conf_artifacts = require('../../../../build/contracts/Conference.json');
const token_artifacts = require('../../../../build/contracts/OTH.json');

@Component({
  selector: 'app-conf-details',
  templateUrl: './conf-details.component.html',
  styleUrls: ['./conf-details.component.css']
})
export class ConfDetailsComponent implements OnInit {
  accounts$: Observable<AccountModel[]>;
  conf$: Observable<ConferenceEntity>;
  currentUser: AccountModel;

  Conference: any;
  ConferenceIns: any;
  TokenIns: any;
  OTH: any;
  tokenDecimals: 0;

  model: ConferenceModel = new ConferenceModel();

  maxNumAttendees = 0;

  vote = {
    id: 0,
    count: 0
  }

  selectedVoucher: Voucher;

  attendeevote = {
    address: "",
    count: 0
  }

  availableSpeakerList = [];

  isMyEvent: Observable<boolean>;
  isOwner: Observable<boolean>;
  canBuy: Observable<boolean>;
  canVote: Observable<boolean>;

  txdatanonzero = 68;

  status = '';

  //events
  Deposit: any;
  _VoteCommitted: any;

  constructor(private web3Service: Web3Service, 
    private accountService: AccountService,
    private conferenceService: ConferenceService,
    private matSnackBar: MatSnackBar, 
    private route: ActivatedRoute) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit(): void {

    console.log('OnInit: ' + this.web3Service);
    console.log(this);

    this.selectedVoucher = new Voucher(-1, "", 0, 0, false);
    this.currentUser = this.accountService.getCurrentUser();
    this.accounts$ = this.route.paramMap.pipe(
        switchMap((params: ParamMap) => {
          return this.accountService.getAccounts();
        })
    );

    this.conf$ = this.route.paramMap.pipe(
        switchMap((params: ParamMap) => {
          return this.conferenceService.getConference(params.get('id'));
        })
    );

    this.onInit();
  }

  watchSpeakers(){
    this.accountService.getSpeakers().subscribe(list => {
        this.model.speakerList = list;
    });
  }

  async onInit() {

    const ca = await this.web3Service.artifactsToContract(conf_artifacts);
    this.Conference = ca;
    
    const ta = await this.web3Service.artifactsToContract(token_artifacts);
    this.OTH = ta;

    this.conf$.subscribe(async c => {
        this.ConferenceIns = await this.initConference(c.address).catch((err) => {
            console.log(err);
            this.setStatus('Error initiating the conference instance; see log.');
        });
        if(!this.ConferenceIns) return;

        this.model = await this.getDetails(c);

        this.watchSpeakers();
        
        const _isOwner = this.model.owner.address.toLowerCase() === this.currentUser.address.toLowerCase();
        console.log("Is owner: " + _isOwner);
        this.isOwner = of(_isOwner);
      
        const myEvent = await this.isUserConference(this.currentUser.address);
        console.log("My event: " + myEvent);
        this.isMyEvent = of(myEvent);

        const acquired = await this.hasVoucher(this.currentUser.address);
        const started = this.model.sDate < new Date();
        const ended = this.model.eDate < new Date();

        const _canBuy = !(_isOwner || myEvent || started || acquired);
        this.canBuy = of(_canBuy);
        console.log("Can buy: " + _canBuy);

        this.canVote = of(myEvent && started && !ended);

        this.refreshSpeakerList();
        this.refreshAttendeeList();

        this.TokenIns = await this.initContract(this.model.token, this.OTH).catch((err) => {
            console.log(err);
            this.setStatus('Error initiating the OTH instance; see log.');
        });

        if(!this.TokenIns) return;
        console.log("Load OTH details");

        const decimals = await this.TokenIns.decimals.call({from: this.currentUser.address}).catch((error) => {
            console.log(error);
            this.setStatus('Error load OTH decimals; see log.');            
        });
        this.tokenDecimals = decimals;
        console.log('Token decimals: ' + this.tokenDecimals);   

        await this.refreshVoucherList();
    });

  }

  async initContract(address, abstraction){    
    return await abstraction.at(address);
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  async setEvents(){
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }

    console.log("Set events.");

    try {
        const deployed = this.ConferenceIns; //await this.Conference.at(this.model.address);
        this.Deposit = await deployed.Deposit();       
        this._VoteCommitted = await deployed._VoteCommitted;

        this.watchEvents();
        
      } catch (e) {
        console.log(e);
        this.setStatus('Error setting events; see log.');
      }
  }

  watchEvents(){
    this.Deposit.watch((error, result) => {
        if(!error){
            console.log("Deposit event watch result");
            console.log(result);
            this.setStatus('Deposit ' + Utilities.convertFromBlockchainFormat(result.args.amount, this.tokenDecimals) + ' OTHs' + ' from ' + result.args._from + ' completed!');
        } else 
            this.setStatus('Deposit ' + Utilities.convertFromBlockchainFormat(result.args.amount, this.tokenDecimals) + ' OTHs' + ' from ' + result.args._from + ' failed!');
    });

    this._VoteCommitted.watch((error, result) => {
        if(!error){
            console.log("_VoteCommitted event watch result");
            console.log(result);
            this.setStatus('Vote ' + result.args.numTokens + ' Committed by {' + this.currentUser.address + '} for candidate ' + result.args.voter + ' completed!');
        }
        else this.setStatus('Vote ' + result.args.numTokens + ' Committed by {' + this.currentUser.address + '} for candidate ' + result.args.voter + ' failed!');
    });    
  }

  async initConference(address){    
    console.log('Initiating the conference instance at ' + address);
    this.setStatus('Initiating transaction... (please wait)');
    
    const instance = await this.Conference.at(address);

    return instance;
  }

  async getDetails(entity) {
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }

    console.log('Get conference parameters');
    try {
    //   this.ConferenceIns = await this.Conference.at(this.model.address);
    //   console.log(conf);

      const conf = this.ConferenceIns;
      let _model = new ConferenceModel();
      _model.address = entity.address;
      _model.title = entity.title;
      _model.descriptions = entity.descriptions;
      _model.image = entity.image;
      _model.organizer = entity.organizer;

      const confDetails = await conf.getConferenceDetails({from: this.currentUser.address});
      console.log(confDetails);

      let sdate = confDetails[0];
      let time = Number(sdate);
      
      _model.sDate = new Date(time * 1000);
      console.log('Start date: ' + _model.sDate);

      const edate = confDetails[1];
      time = Number(edate);
      
      _model.eDate = new Date(time * 1000);
      console.log('End date: ' + _model.eDate);

      const owner = confDetails[2];//await conf.owner.call({from: this.currentUser.address});
      let org$ = this.accountService.getAccount(owner);
      org$.subscribe(acc => {
        _model.owner = new AccountModel(acc.address, acc.publicKey, acc.privateKey, acc.firstName, acc.lastName);
      });

      console.log('Owner: ' + _model.owner);      

      _model.numVotTokens = confDetails[3];
      console.log('Number vot tokens: ' + _model.numVotTokens);

      _model.numAttendees = confDetails[4];
      console.log('Number of attendees: ' + _model.numAttendees);

      _model.maxAttendees = confDetails[5];
      this.maxNumAttendees = _model.maxAttendees;
      console.log('Max number limit of attendees: ' + _model.maxAttendees);

      _model.token = confDetails[6];
      console.log('Token address: ' + _model.token);

      _model.attendeeFreeSlots = _model.maxAttendees - _model.numAttendees;
      console.log('Number of free attendee slots: ' + _model.attendeeFreeSlots);

      _model.voucherDiscountDecimals = confDetails[7];
      console.log("Voucher discount decimals: " + confDetails[7]);

      _model.voucherCount = confDetails[8];
      console.log('Count of vouchers: ' + _model.voucherCount);

      return _model;

    } catch (e) {
      console.log(e);
      this.setStatus('Error getting conference; see log.');
    }
  }

  async isUserConference(address){
    const attendee = await this.ConferenceIns.addressAttendees(address);
    const myEvent = attendee[0] > 0;
    console.log("My event: " + myEvent);

    return myEvent;
  }

  async hasVoucher(address){
    const acquiredVoucherId = await this.ConferenceIns.acquiredVouchers(address);

    return acquiredVoucherId > 0;
  }

  async refreshSpeakerList(){
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }
    try {
        console.log("Refresh speaker list");

        //this.model.speakerList = [];
        for(var i = 0; i < this.model.speakerList.length; i++){
            let speaker = this.model.speakerList[i];
            const voteCount = await this.ConferenceIns.speakerVotesReceived.call(speaker.id, {from: this.currentUser.address});
            console.log("Count vote for speaker " + speaker.fullName() + " is " + voteCount);
            speaker.voteCount = voteCount;            
        }
    } catch (e) {
        console.log(e);
        this.setStatus('Error refresh speaker list; see log.');
    }
  }

  async refreshAttendeeList(){
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }
    try {
        console.log("Refresh attendee list");

        this.model.attendeeList = [];
        this.accountService.getAccounts().subscribe(list => {
            list.map(async acc => {
                if(acc.address.toLowerCase() != this.currentUser.address.toLowerCase()){
                    const attendeeDetails = await this.ConferenceIns.addressAttendees.call(acc.address, {from: this.currentUser.address});
                    if(attendeeDetails[0] > 0){
                        let attendee = new Attendee(acc.address, acc.publicKey, acc.privateKey, acc.firstName, acc.lastName);
                        attendee.voteCount = attendeeDetails[3];
                        this.model.attendeeList.push(attendee);
                    }
                }
            })
        })
    } catch (e) {
        console.log(e);
        this.setStatus('Error refresh attendee list; see log.');
    }
  }

  mappingToVaucher(voucher){
    const id = voucher[0];
    const title = voucher[1];
    const discount = Utilities.convertFromBlockchainFormat(voucher[2], this.model.voucherDiscountDecimals);
    const price = Utilities.convertFromBlockchainFormat(voucher[3], this.tokenDecimals);
    const active = voucher[4];

    return new Voucher(id, title, discount, price, active);
  }

  async refreshVoucherList() {
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }
    
    try {
      console.log('Get vouchers.');
    
      const conf = this.ConferenceIns; //await this.Conference.at(this.model.address);

      //var tmp = this.model.vouchers.sort();
      //console.log(tmp);
      this.model.voucherList = [];

      for(var i = 1; i <= this.model.voucherCount; i++){
        console.log("Voucher id: " + i);
        
        const _voucherDetails = await conf.vouchers.call(i, {from: this.currentUser.address});
        console.log(_voucherDetails);

        let _voucher = [_voucherDetails[0], _voucherDetails[1], _voucherDetails[2], _voucherDetails[3], _voucherDetails[4]];
        var active =_voucherDetails[4];
        if(active){
            const vm = this.mappingToVaucher(_voucher);
            this.model.voucherList.push(vm);
        }
      }
      console.log("Count of vouchers: " + this.model.voucherList.length);

    } catch (e) {
      console.log(e);
      this.setStatus('Error getting vouchers; see log.');
    }

  }

  setVoteAddress(e){
    console.log('Setting vote address : ' + e.value);
    this.vote.id = e.value;
  }

  setVoteNumTokens(e){
    console.log('Setting vote num tokens: ' + e.target.value);
    this.vote.count = e.target.value;
  }

  setAttendeeVoteAddress(e){
    console.log('Setting vote address : ' + e.value);
    this.attendeevote.address = e.value;
  }

  setAttendeeVoteNumTokens(e){
    console.log('Setting vote num tokens: ' + e.target.value);
    this.attendeevote.count = e.target.value;
  }

  //users functions
  async approve() {    
    const amount = Utilities.convertToBlockchainFormat(this.selectedVoucher.price, this.tokenDecimals);
    let estimateGas = await this.TokenIns.approve.estimateGas(this.model.address, amount);
    console.log("Estimate gas: " + estimateGas);
    return await this.TokenIns.approve.sendTransaction(this.model.address, amount, {from: this.currentUser.address, gas: estimateGas});        
  }

  async buy() {
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }

    if (!this.TokenIns) {
        this.setStatus('Token is not loaded, unable to send transaction');
        return;
    }

    if(this.selectedVoucher.id <= 0){
        this.setStatus('Voucher is required.');
        return;
    }
    
    if(this.model.attendeeFreeSlots == 0){
        this.setStatus("No free attendees slots to conference");
        return;
    }
        
    try {

        console.log('Approve the passed address ' + this.model.address);

        this.setStatus('Initiating approve transaction... (please wait)');        

        const atx = await this.approve();
        console.log("Approve Transaction hash " + atx);
        if (!atx) {
           this.setStatus('Approve Transaction failed!');
        }else {
           this.setStatus('Transaction submitted! Wait mine a block');
           console.log("Wait mine a block");
           const areceipt = await this.web3Service.waitBlock(atx);
            if(!areceipt.status){
                this.setStatus("Transaction mined but execution failed");
                return;
            }
            console.log('Transaction confirmed!');
            this.setStatus('Transaction confirmed!');

            console.log('Buy voucher by ' + this.currentUser.address);

            this.setStatus('Initiating buy transaction... (please wait)');

            const conf = this.ConferenceIns; //await this.Conference.at(this.model.address);
            console.log(conf);

            let estimateGas = await conf.buyVoucher.estimateGas(this.selectedVoucher.id, {from: this.currentUser.address});
            console.log("Estimate gas: " + estimateGas);

            let gasLimit = estimateGas * 2;
            console.log("Gas Limit: " + gasLimit);

            const transaction = await conf.buyVoucher.sendTransaction(this.selectedVoucher.id, {from: this.currentUser.address, gas: gasLimit});
        
            if (!transaction) {
                this.setStatus('Buy Transaction failed!');
            } else {
                this.setStatus('Transaction submited! Wait the block');
                console.log("Wait mine the block");
                const rec = await this.web3Service.waitBlock(transaction);
                if(!rec.status){
                    this.setStatus("Transaction mined but execution failed");
                    return;
                }
                this.setStatus('Transaction confirmed!');    
                this.canBuy = of(false); 
            }
        }      
    } catch (e) {
      console.log(e);
      this.setStatus('Error buying voucher; see log.');
    }
  }

  async voteForSpeaker() {
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }

    if(!this.currentUser.address){
        this.setStatus('Account address is required.');
        return;
    }

    if(this.vote.count == 0){
        this.setStatus("The vote number tokens can be greater then 0.");
        return;
    }

    if(this.vote.id == 0){
        this.setStatus("The speaker is required.");
        return;
    }

    console.log('Vote for speaker ' + this.vote.id);

    this.setStatus('Initiating transaction... (please wait)');

    try {
        const conf = this.ConferenceIns; //await this.Conference.at(this.model.address);
        console.log(conf);
        
        const estimateGas = await conf.voteForSpeaker.estimateGas(this.vote.id, this.vote.count);
        console.log("Estimate gas is " + estimateGas);
        
        const gasLimit = estimateGas * 2;
        console.log("Gas Limit: " + gasLimit);

        const transaction = await conf.voteForSpeaker.sendTransaction(this.vote.id, this.vote.count, {from: this.currentUser.address, gas: gasLimit});
        
        if (!transaction) {
            this.setStatus('Transaction failed!');
        } else {
            this.setStatus('Transaction submited! Wait the block');
            console.log("Wait mine the block");
            const rec = await this.web3Service.waitBlock(transaction);
            if(!rec.status){
                this.setStatus("Transaction mined but execution failed");
                return;
            }

            this.refreshSpeakerList();
        }
    } catch (e) {
        console.log(e);
        this.setStatus('Error vote for speaker; see log.');
    }
  }

  async voteForAttendee() {
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }

    if(this.attendeevote.count == 0){
        this.setStatus("The vote number tokens can be greater then 0.");
        return;
    }

    if(!this.attendeevote.address){
        this.setStatus("The attendee is required.");
        return;
    }

    console.log('Vote for candidate ' + this.attendeevote.address);

    this.setStatus('Initiating transaction... (please wait)');

    try {
        const conf = this.ConferenceIns; //await this.Conference.at(this.model.address);
        console.log(conf);

        const estimateGas = await conf.voteForAttendee.estimateGas(this.attendeevote.address, this.attendeevote.count);
        console.log("Estimate gas is " + estimateGas);

        const gasLimit = estimateGas * 2;
        console.log("Gas Limit: " + gasLimit);

        const transaction = await conf.voteForAttendee.sendTransaction(this.attendeevote.address, this.attendeevote.count, {from: this.currentUser.address, gas: gasLimit});
        
        if (!transaction) {
            this.setStatus('Transaction failed!');
        } else {
            this.setStatus('Transaction submited! Wait the block');
            console.log("Wait mine the block");
            const rec = await this.web3Service.waitBlock(transaction);
            if(!rec.status){
                this.setStatus("Transaction mined but execution failed");
                return;
            }

            this.refreshAttendeeList();
        }
    } catch (e) {
        console.log(e);
        this.setStatus('Error vote For Attendee; see log.');
    }
  }
}