import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { Web3Service } from '../../../util/web3.service';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { ConferenceModel, ConferenceService, ConferenceEntity, Voucher } from '../../../conference.service';
import { AccountModel, AccountService, Speaker, Attendee } from '../../../account/account.service';
import { Observable } from 'rxjs';
import { TokenModel, TokenService } from '../../../token.service';
import { Utilities } from '../../../util/utilities';

declare let require: any;
const conf_artifacts = require('../../../../../build/contracts/Conference.json');
const token_artifacts = require('../../../../../build/contracts/OTH.json');

@Component({
  selector: 'app-conf-details',
  templateUrl: './conf-details.component.html',
  styleUrls: ['./conf-details.component.css']
})
export class ConfDetailsComponent implements OnInit {
  accounts:AccountModel[] = [];
  accounts$: Observable<AccountModel[]>;
  conf$: Observable<ConferenceEntity>;
  //speakers$: Observable<string[]>;

  currentUser: AccountModel;
  
  TokenIns; ConferenceIns; OTH; Conference;
  model: ConferenceModel = new ConferenceModel();
  tokenModel: TokenModel = new TokenModel();
  
  maxNumAttendees = 0;

  availableSpeakerList: AccountModel[];
  
  refundRecipientAddress = "";
  registerAddress="";

  newVoucher: Voucher; editedVoucher: Voucher; 
  acquiredVoucher = {
      voucher: new Voucher(-1, "", 0, 0, false),
      paid: 0
    };

  voucherAdding = false;
  voucherChange = false;
  addingSpeakers = false;
  removingSpeakers = false;
  refunding = false;
  registerAttendee = false;
  unregisterAttendees = false;
  changingMaxAttendees = false;

  Refund: any;

  status = '';

  constructor(private web3Service: Web3Service, 
    private accountService: AccountService,
    private conferenceService: ConferenceService,
    private tokenService: TokenService,
    private matSnackBar: MatSnackBar, 
    private route: ActivatedRoute) {
    
    this.editedVoucher = new Voucher(-1, "", 0, 0, false);
    this.newVoucher = new Voucher(-1, "", 0, 0, false);
  }

  ngOnInit(): void {

    console.log('OnInit');
    console.log(this);
    
    this.watchAccount();
    // this.route.paramMap.pipe(
    //     switchMap((params: ParamMap) => {
    //       return this.accountService.getAccounts();
    //     })
    // );

    this.conf$ = this.route.paramMap.pipe(
        switchMap((params: ParamMap) => {
          return this.conferenceService.getConference(params.get('id'));
        })
    );

    this.currentUser = this.accountService.getCurrentUser();

    this.onInit();
    
  }

  async onInit() {

    const ca = await this.web3Service.artifactsToContract(conf_artifacts)
    .then((confAbstraction) => {
        this.Conference = confAbstraction;
    });
    const ta = await this.web3Service.artifactsToContract(token_artifacts)
    .then((tokenAbstraction) => {
        this.OTH = tokenAbstraction;
    });

    this.conf$.subscribe(async c => {
        console.log('Initiating the conference instance at ' + c.address);
        this.setStatus('Initiating the conference instance... (please wait)');

        this.ConferenceIns = await this.initContract(c.address, this.Conference).catch((err) => {
            console.log(err);
            this.setStatus('Error initiating the conference instance; see log.');
        });
        this.model = await this.getDetails(c);

        //this.watchAccount();
        this.watchSpeakers();

        this.refreshAvailableSpeakers();
        this.refreshSpeakerList();
        this.refreshAttendeeList();

        console.log('Initiating the OTH instance at ' + this.model.token);
        this.setStatus('Initiating the OTH instance... (please wait)');

        this.TokenIns = await this.initContract(this.model.token, this.OTH).catch((err) => {
            console.log(err);
            this.setStatus('Error initiating the OTH instance; see log.');
        });

        console.log("Load OTH details");
        this.setStatus('Loading the OTH details... (please wait)');

        const details = await this.tokenService.loadDetails(this.TokenIns, this.currentUser.address).then((model) => {
            console.log(model)
            model.address = this.model.token;
            this.accountService.getAccount(model.owner.address).subscribe(acc => {
                model.owner = new AccountModel(acc.address, acc.publicKey, acc.privateKey, acc.firstName, acc.lastName)
            });

            this.tokenModel = model;

            return model;
            
        }).catch((error) => {
            console.log(error);
            this.setStatus('Error load OTH details; see log.');            
        });
        
        await this.refreshVoucherList();
    });

  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  async initContract(address, abstraction){    
    return await abstraction.at(address);
  }

  async getDetails(entity) {
    console.log('Get conference parameters');
    this.setStatus('Getting conference details... (please wait)');
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
      _model.created = entity.created;
      _model.createdBy = entity.createdBy;

      const confDetails = await conf.getConferenceDetails({from: this.currentUser.address});

      let sdate = confDetails[0];
      let time = Number(sdate);
      _model.sDate = new Date(time * 1000);
      console.log('Start date: ' + _model.sDate);

      const edate = confDetails[1];
      time = Number(edate);
      _model.eDate = new Date(time * 1000);
      console.log('End date: ' + _model.eDate);

      const owner = confDetails[2]; //await conf.owner.call({from: this.currentUser.address});
      let org$ = this.accountService.getAccount(owner);
      org$.subscribe(acc => {
        _model.owner = new AccountModel(acc.address, acc.publicKey, acc.privateKey, acc.firstName, acc.lastName);
      });

      console.log('Owner: ' + _model.owner);

      _model.numVotTokens = confDetails[3];
      console.log('Number vot tokens: ' + _model.numVotTokens);

      _model.numAttendees = confDetails[4];
      console.log('Number of registered attendees: ' + _model.numAttendees);

      _model.maxAttendees = confDetails[5];
      this.maxNumAttendees = _model.maxAttendees;
      console.log('Max number limit of attendees: ' + _model.maxAttendees);

      _model.attendeeFreeSlots = _model.maxAttendees - _model.numAttendees;
      console.log('Number of free attendee slots: ' + _model.attendeeFreeSlots);

      _model.token = confDetails[6];
      console.log('Token address: ' + _model.token);

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

  watchAccount(){
    this.accounts$ = this.accountService.getAccounts();
    this.accounts$.subscribe(accs => {
        this.accounts = accs;
        this.registerAddress = accs[0].address;
    })
  }

  watchSpeakers(){
    this.accountService.getSpeakers().subscribe(list => {
        this.model.speakerList = list;
    });
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

  refreshAvailableSpeakers(){
    console.log("Refresh Available Speakers");
    this.availableSpeakerList = [];
    
    console.log(this.accounts);

    this.accounts.map(acc => {
        const index = this.model.speakerList.findIndex(s => acc.address.toLowerCase() == s.address.toLowerCase())
        if(index == -1){
            this.availableSpeakerList.push(acc);
        }   
    })
  }

  getMaxSpeakerId(){
    let maxId = 0;
    this.model.speakerList.map(s => {
        if(s.id > maxId) maxId = s.id;        
    })

    return maxId;
  }

  async addSpeakers(selected){
    console.log('Add speakers.');
    
    //const len = this.model.speakerList.length;
    //let tmp = this.model.speakerList.slice();
    this.addingSpeakers = true;
    selected.map(elements => {
        const address = elements.value;
        const newId = this.getMaxSpeakerId() + 1;
        
        if(this.model.speakerList.findIndex(s => s.address.toLowerCase() == address.toLowerCase()) == -1){
            const acc = this.availableSpeakerList.find(a => a.address.toLowerCase() == address.toLowerCase());
            let speaker = new Speaker(newId, acc.address, acc.publicKey, acc.privateKey, acc.firstName, acc.lastName);
            this.model.speakerList.push(speaker);
            //tmp.push(item);
        }
    });

    this.refreshAvailableSpeakers();
    this.addingSpeakers = false;

    // if (len == tmp.length) return;

    // this.addingSpeakers = true;
    // this.setStatus('Initiating transaction... (please wait)');

    // const tx = await this.setSpeakerList(tmp).catch((error) => {
    //     this.addingSpeakers = false;
    //     console.log(error);
    //     this.setStatus('Error setting speaker list; see log.');
    // });

    // if (!tx) {
    //     this.addingSpeakers = false;
    //     this.setStatus('Transaction failed!');
    // } else {
    //     this.setStatus('Transaction submitted! Wait mine a block');
    //     console.log("Wait mine a block");
    //     const receipt = await this.web3Service.waitBlock(tx);
    //     if (!receipt.status) {
    //         this.setStatus("Transaction mined but execution failed");
    //         return;
    //     }
    //     this.setStatus('Transaction confirmed!');
    //     this.addingSpeakers = false;
    //     this.refreshSpeakerList();
    //     //this.refreshAvailableSpeakers();
    // }
  }

  removeSpeakers(selected) {

    console.log('Remove speakers.');
    
    let removedList = selected.map(elements => {
        return elements.value;
      });
    
    let tmp = [];
    this.model.speakerList.map((item) => {
        if(removedList.findIndex(s => s == item.id) == -1){
            tmp.push(item);
        }
    })

    this.removingSpeakers = true;
    this.setStatus('Initiating transaction... (please wait)');
    this.model.speakerList = tmp.slice();
    this.refreshAvailableSpeakers();
    this.removingSpeakers = false;
    // this.setSpeakerList(tmp).then((transaction) => {
    //     if (!transaction) {
    //         this.removingSpeakers = false; 
    //         this.setStatus('Transaction failed!');
    //     } else {
    //         this.setStatus('Transaction submitted! Wait mine a block');
    //         console.log("Wait mine a block");
    //         this.web3Service.waitBlock(transaction).then((receipt) => {
    //             if (!receipt.status) {
    //                 this.setStatus("Transaction mined but execution failed");
    //             }
    //             else {
    //                 this.setStatus('Transaction confirmed!');
    //                 this.removingSpeakers = false;
    //                 this.model.speakers = tmp;
    //                 this.refreshSpeakerList();
    //                 //this.refreshAvailableSpeakers();
    //             }
    //         });   
    //     }
    // }).catch((error) =>{
    //     console.log(error);
    //     this.removingSpeakers = false;
    //     this.setStatus('Error removing speakers; see log.');
    // });
  }
  
  async setSpeakerList(list:Speaker[]) {

    let trxs = [];
    for(var i = 0; i < list.length; i++){
    
        const speaker = list[i];
        const estimateGas = await this.ConferenceIns.addSpeaker.estimateGas(speaker.address);
        console.log("Estimate gas: " + estimateGas);

        let hasError = false;
        const tx = await this.ConferenceIns.addSpeaker.sendTransaction(speaker.address, {from: this.currentUser.address, gas: estimateGas}).catch((error) => {
            this.addingSpeakers = false;
            hasError = true;
            console.log("Error adding speaker " + speaker.address);
            console.log(error);
        });
    
        if(hasError) continue;

        if (!tx) {
            this.addingSpeakers = false;
            console.log('Transaction failed!');
        } else {
            console.log('Transaction submitted! Wait mine a block');
            trxs.push(tx);            
        };
    }

    if(trxs.length == 0){
        this.setStatus('Transaction failed. See logs');
        return;
    }

    for(var i = 0; i < trxs.length; i++){
        const tx = trxs[i];
        const receipt = await this.web3Service.waitBlock(tx);
        if (!receipt.status) {
            console.log( `Transaction ${tx} mined but execution failed`);
            continue;
        }
        console.log( `Transaction ${tx} confirmed.`);        
    }

    this.addingSpeakers = false;
    this.refreshSpeakerList();
    //this.refreshAvailableSpeakers();
  }

  fromBlockchainFormat(amount, decimals){
    if (decimals > 16) {
      return Number(this.web3Service.fromWei(amount, "ether"));
    }
     
    return Utilities.convertFromBlockchainFormat(amount, decimals);
  } 

  async getConferenceBalance() {
    console.log('Get conference balance');
    try {
      //const conf = await this.Conference.at(this.model.address);
      console.log(this.ConferenceIns);

      const balance = await this.ConferenceIns.getConferenceBalance.call({from:this.currentUser.address}); 
      this.model.balance = this.fromBlockchainFormat(balance, this.tokenModel.decimals); 
      
      console.log('Balance(wei): ' + balance);
      console.log('Balance(oth): ' + this.model.balance);

      await this.web3Service.getBalance(this.model.address).then(b => {
        const eth = this.web3Service.fromWei(b, "ether");
        this.model.balanceEth = Number(eth);
        console.log("Balance(wei): " + b);
        console.log("Balance(ether): " + eth);

      });

    } catch (e) {
      console.log(e);
      this.setStatus('Error getting conference balance; see log.');
    }
  }

  async changeMaxNumAttendees() {
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }

    if(this.maxNumAttendees == 0){
        this.setStatus("The max number of free slots should be greater then 0.");
        return;
    }

    if(this.model.numAttendees > this.maxNumAttendees){
        this.setStatus("The max number of free slots should be greater then current registered attendees.");
        return;
    }

    console.log('Setting the max attendees to ' + this.maxNumAttendees);

    this.setStatus('Initiating transaction... (please wait)');

    this.changingMaxAttendees = true;

    try {
        const conf = this.ConferenceIns; //await this.Conference.at(this.model.address);
        console.log(conf);

        const estimateGas = await this.ConferenceIns.changeMaxNumAttendees.estimateGas(this.maxNumAttendees);
        console.log("Estimate gas: " + estimateGas);

        let gasLimit = estimateGas * 2;
        console.log("Gas Limit: " + gasLimit);

        const transaction = await conf.changeMaxNumAttendees.sendTransaction(this.maxNumAttendees, {from: this.currentUser.address, gas: gasLimit});
        
        if (!transaction) {
            this.changingMaxAttendees = false;
            this.setStatus('Transaction failed!');
        } else {
            this.setStatus('Transaction submitted! Wait mine a block');
            console.log("Wait mine a block");
            const receipt = await this.web3Service.waitBlock(transaction);
            if(!receipt.status){
                this.setStatus("Transaction mined but execution failed");
                return;
            }
            this.setStatus('Transaction confirmed!');
            this.changingMaxAttendees = false;
            this.model.maxAttendees = this.maxNumAttendees;
            this.model.attendeeFreeSlots = this.model.maxAttendees - this.model.numAttendees; 
        }
    } catch (e) {
        this.changingMaxAttendees = false;
        console.log(e);
        this.setStatus('Error change Max Num Attendees; see log.');
    }
  }

  async refund() {
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }

    if (this.refundRecipientAddress == "") {
        this.setStatus('Recipient address is required.');
        return;
    }

    console.log('Refund amount to ' + this.refundRecipientAddress);

    this.setStatus('Initiating transaction... (please wait)');
    this.refunding = true;
    try {
        const conf = this.ConferenceIns; //await this.Conference.at(this.model.address);
        console.log(conf);

        let estimateGas = await this.ConferenceIns.refund.estimateGas(this.refundRecipientAddress);
        console.log("Estimate gas: " + estimateGas);

        let gasLimit = estimateGas * 2;
        console.log("Gas Limit: " + gasLimit);

        const transaction = await conf.refund.sendTransaction(this.refundRecipientAddress, {from: this.currentUser.address, gas: gasLimit});

        if (!transaction) {
            this.refunding = false;
            this.setStatus('Transaction failed!');
        } else {
            this.setStatus('Transaction submitted! Wait mine a block');
            console.log("Wait mine a block");
            const receipt = await this.web3Service.waitBlock(transaction);
            this.refunding = false;
            if(!receipt.status){
                this.setStatus("Transaction mined but execution failed");
                return;
            }
            this.setStatus('Transaction confirmed!');
            //this.refunding = false;
            let tmp = this.model.attendeeList.filter(item => item.address.toLowerCase() != this.refundRecipientAddress.toLowerCase());
            this.model.attendeeList = tmp.slice();
            this.refreshAttendeeList();
        }
    } catch (e) {
        this.refunding = false;
        console.log(e);
        this.setStatus('Error refund amount for voucher; see log.');
    }
  }

//   refreshAttendeeList(){
//     this.model.attendeeList = [];
//     this.model.attendees.map(address => {
//       console.log(address);
//       this.accountService.getAccount(address).subscribe(val => {
//           if(val){
//               console.log(val);
//               this.model.attendeeList.push(new AccountModel(val.address, val.publicKey, val.privateKey, val.firstName, val.lastName));
//           }
//       });
//     })
//   }

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
                const attendeeDetails = await this.ConferenceIns.addressAttendees.call(acc.address, {from: this.currentUser.address});
                    if(attendeeDetails[0] > 0){
                        let attendee = new Attendee(acc.address, acc.publicKey, acc.privateKey, acc.firstName, acc.lastName);
                        attendee.voteCount = attendeeDetails[3];
                        this.model.attendeeList.push(attendee);
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
    const price = this.fromBlockchainFormat(voucher[3], this.tokenModel.decimals);
    console.log("mapped price: "+price);
    const active = voucher[4];

    return new Voucher(id, title, discount, price, active);
  }

  async refreshVoucherList() {

    try {
      console.log('Get vouchers.');
    
      const conf = this.ConferenceIns; //await this.Conference.at(this.model.address);
      console.log(conf);
      
      for(var i = 1; i <= this.model.voucherCount; i++){
        const _voucherDetails = await this.getVoucherDetails(i);
        console.log(_voucherDetails);
        //let _voucher = [_voucherDetails[0], _voucherDetails[1], _voucherDetails[2], _voucherDetails[3], _voucherDetails[4]];
        
        const vm = this.mappingToVaucher(_voucherDetails);
        this.model.voucherList.push(vm);
      }

    } catch (e) {
        console.log(e);
        this.setStatus('Error getting vouchers; see log.');
    }
  
  }
//   async refreshVoucherList1() {

//     try {
//       console.log('Get vouchers.');
    
//       const conf = this.ConferenceIns; //await this.Conference.at(this.model.address);
//       console.log(conf);
//       this.model.vouchers = await conf.getVoucherIds.call({from: this.currentUser.address});
//       this.model.vouchers.sort();
//       console.log(this.model.vouchers);
//       this.model.voucherList = [];

//       for(var i = 0; i < this.model.vouchers.length; i++){
//         var id = this.model.vouchers[i];
//         console.log("Voucher id: " + id);
//         const _voucherDetails = await this.getVoucherDetails(id);
//         console.log(_voucherDetails);
//         let _voucher = [_voucherDetails[0], _voucherDetails[1], _voucherDetails[2], _voucherDetails[3], _voucherDetails[4]];
        
//         const vm = this.mappingToVaucher(_voucher);
//         this.model.voucherList.push(vm);
//       }
//       console.log("Count of vouchers: " + this.model.voucherList.length);
      
//       if(this.model.voucherList.length > 0){
//         Utilities.sortArrayByDate(this.model.voucherList, SortDirectionEnum.desc);
//         this.editedVoucher = this.model.voucherList[0];
//       }

//     } catch (e) {
//       console.log(e);
//       this.setStatus('Error getting vouchers; see log.');
//     }

//   }

  async getVoucherDetails(id) {
    const conf = this.ConferenceIns; //await this.Conference.at(this.model.address);
    return await this.conferenceService.getVoucherDetails(id, this.currentUser.address, conf);
  }

  setRegisterAddress(e) {
    console.log('Setting register address: ' + e.value);
    this.registerAddress = e.value;
    this.getVoucher();
  }

  async register() {
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }

    if (!this.registerAddress) {
        this.setStatus('Participant address is required.');
        return;
    }
    
    console.log('Register to the conference of ' + this.registerAddress);

    this.setStatus('Initiating transaction... (please wait)');
    this.registerAttendee = true;
    try {

        const estimateGas = await this.ConferenceIns.register.estimateGas(this.registerAddress);
        console.log("Estimate gas: " + estimateGas);

        let gasLimit = estimateGas * 2;
        console.log("Gas Limit: " + gasLimit);

        const transaction = await this.ConferenceIns.register.sendTransaction(this.registerAddress, { from: this.currentUser.address, gas: gasLimit });

        if (!transaction) {
            this.registerAttendee = false;
            this.setStatus('Transaction failed!');
        } else {
            this.setStatus('Transaction submitted! Wait mine a block');
            console.log("Wait mine a block");
            this.web3Service.waitBlock(transaction).then((receipt) => {
                if (!receipt.status) {
                    this.setStatus("Transaction mined but execution failed");
                }
                else {
                    this.setStatus('Transaction confirmed!');
                    this.registerAttendee = false;
                    
                    this.refreshAttendeeList();
                }
            });
        }

    } catch (e) {
        this.registerAttendee = false;
        console.log(e);
        this.setStatus('Error register; see log.');
    }
  }

  async unregisterSelected(selected) {
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }
    
    const removedList = selected.map(elements => {
        return elements.value;
    });
    
    try {

        this.unregisterAttendees = true;
    
        console.log('Unregister from the conference of ' + removedList.length + " attendees.");
        this.setStatus('Initiating transaction... (please wait)');

        let trxs = [];
        for(var i = 0; i < removedList.length; i++){
        
            const address = removedList[i];
            const tx = await this.unregister(address);
            if(!tx) continue;
            
            trxs.push(tx);
        }

        if(trxs.length == 0){
            this.unregisterAttendees = false;
            this.setStatus('Transaction failed. See logs');
            return;
        }

        for(var i = 0; i < trxs.length; i++){
            const tx = trxs[i];
            const receipt = await this.web3Service.waitBlock(tx);
            if (!receipt.status) {
                console.log( `Transaction ${tx} mined but execution failed`);
                continue;
            }
            console.log( `Transaction ${tx} confirmed.`);        
        }

        this.unregisterAttendees = false;
        this.refreshAttendeeList();        

    } catch (e) {
        this.unregisterAttendees = false;
        console.log(e);
        this.setStatus('Error unregister; see log.');
    }
  }

  async unregister(address){
    const estimateGas = await this.ConferenceIns.unregister.estimateGas(address);
    console.log("Estimate gas: " + estimateGas);

    let gasLimit = estimateGas * 2;
    console.log("Gas Limit: " + gasLimit);
    
    let hasError = false;
    const transaction = await this.ConferenceIns.unregister.sendTransaction(address, { from: this.currentUser.address, gas: gasLimit }).catch((error) => {
        hasError = true;
        console.log("Error unregister address " + address);
        console.log(error);
    });

    if(hasError) return null;

    if (!transaction) {
        console.log('Transaction failed!');
    } else {
        console.log('Transaction submitted! Wait mine a block');       
    };

    return transaction;    
  }

  async getVoucher(){
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }
    
    try {
        console.log('Get voucher');
        console.log(this.registerAddress);

        if (this.registerAddress == "") {
            this.setStatus("The address is required");
            return;
        }

        const vid = await this.ConferenceIns.acquiredVouchers.call(this.registerAddress);
        if(vid <= 0){
            console.log("Account didn't acquired a voucher.");
            this.acquiredVoucher.voucher = new Voucher(-1, "", 0, 0, false);
            this.acquiredVoucher.paid = 0;
            return;
        }
        const _voucherEntity = await this.getVoucherDetails(vid);

        let _voucher = [_voucherEntity[0], _voucherEntity[1], _voucherEntity[2], _voucherEntity[3], _voucherEntity[4]];
        let voucher = this.mappingToVaucher(_voucher);
        
        Object.assign(this.acquiredVoucher.voucher, voucher);

        const paid = await this.ConferenceIns.paidByVoucherMap(this.registerAddress);
        this.acquiredVoucher.paid = this.fromBlockchainFormat(paid, this.tokenModel.decimals);

    } catch (e) {
        console.log(e);
        this.setStatus('Error getting voucher; see log.');
    }
  }

  test(){
    const c = this.web3Service.createContract(conf_artifacts.abi, this.ConferenceIns.address, this.currentUser.address);
  }

  async createVoucher(voucher:Voucher){
    var discount = Utilities.convertToBlockchainFormat(voucher.discount, this.model.voucherDiscountDecimals);
    var price = Utilities.convertToBlockchainFormat(voucher.price, this.tokenModel.decimals);
    
    const estimateGas = await this.ConferenceIns.addVoucher.estimateGas(voucher.title, discount, price, voucher.active);
    console.log("Estimate gas: " + estimateGas);

    let gasLimit = estimateGas * 2;
    console.log("Gas Limit: " + gasLimit);
    
    return await this.ConferenceIns.addVoucher.sendTransaction(voucher.title, discount, price, voucher.active, { from:this.currentUser.address, gas:gasLimit });    
  }

  async addVoucher(){
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }

    if (this.newVoucher.title == "") {
        this.setStatus('Voucher title is required.');
        return;
    }

    console.log('Add voucher ' + this.newVoucher.toString());
    console.log("Discount: " + this.newVoucher.discount);

    this.setStatus('Initiating transaction... (please wait)');
    this.voucherAdding = true;
    try {

        let transaction = await this.createVoucher(this.newVoucher)
        if (!transaction) {
            this.voucherAdding = false;
            this.setStatus('Transaction failed!');
        } else {
            this.setStatus('Transaction submited! Wait the block');
            console.log("Wait mine the block");
            this.web3Service.waitBlock(transaction).then((receipt) => {
                if (!receipt.status) {
                    this.setStatus("Transaction mined but execution failed");
                }
                else {
                    this.setStatus('Transaction confirmed!');
                    this.voucherAdding = false;
                    this.newVoucher = new Voucher(-1, "", 0, 0, false);
                    this.model.voucherCount++;
                    this.refreshVoucherList();
                }
            });   
        }

    } catch (e) {
        this.voucherAdding = false;
        console.log(e);
        this.setStatus('Error add a voucher; see log.');
    }
  }

  async changeVoucherState(){
    if (!this.ConferenceIns) {
        this.setStatus('Conference is not loaded, unable to send transaction');
        return;
    }

    if (this.editedVoucher.id <= 0) {
        this.setStatus('Voucher Id should be greater then 0.');
        return;
    }

    console.log('Change state of voucher ' + this.editedVoucher.toString());

    this.setStatus('Initiating transaction... (please wait)');
    this.voucherChange = true;
    try {

        const estimateGas = await this.ConferenceIns.changeVoucherState.estimateGas(this.editedVoucher.id, this.editedVoucher.active);
        console.log("Estimate gas: " + estimateGas);

        let gasLimit = estimateGas * 2;
        console.log("Gas Limit: " + gasLimit);

        const transaction = await this.ConferenceIns.changeVoucherState.sendTransaction(this.editedVoucher.id, this.editedVoucher.active, {from:this.currentUser.address, gas: gasLimit});

        if (!transaction) {
            this.voucherChange = false;
            this.setStatus('Transaction failed!');
        } else {
            this.setStatus('Transaction submited! Wait the block');
            console.log("Wait mine the block");
            this.web3Service.waitBlock(transaction).then((receipt) => {
                if (!receipt.status) {
                    this.setStatus("Transaction mined but execution failed");
                }
                else {
                    this.setStatus('Transaction confirmed!');
                    this.voucherChange = false;
                }
            });   
        }

    } catch (e) {
        this.voucherChange = false;
        console.log(e);
        this.setStatus('Error change state of a voucher; see log.');
    }
  }


//   async getDetails() {
//     console.log('Get conference parameters');
//     try {

//       const conf = this.ConferenceIns;
//       let _model = new ConferenceModel();
//       _model.address = conf.address;
      
//       const organizer = await conf.organizer.call({from: this.currentUser.address});
//       let org$ = this.accountService.getAccount(organizer);
//       org$.subscribe(acc => {
//         _model.organizer = new Organizer(acc.address, acc.publicKey, acc.privateKey, acc.firstName, acc.lastName)          
//       });

//       console.log('Organizer: ' + _model.organizer);

//       _model.token = await conf.getTokenAddress.call({from: this.currentUser.address});
//       console.log('Token address: ' + _model.token);

//       let sdate = await conf.startDate.call({from: this.currentUser.address});
//       let time = parseInt(sdate);
//       _model.sDate = (new Date(time)).toLocaleDateString();
//       console.log('Start date: ' + _model.sDate);
//       console.log(time);

//       const edate = await conf.endDate.call({from: this.currentUser.address});
//       time = parseInt(edate);
      
//       _model.eDate = (new Date(time)).toLocaleDateString();
//       console.log('End date: ' + _model.eDate);
//       console.log(time);

//       _model.numVotTokens = await conf.countVotTokens.call({from: this.currentUser.address});
//       console.log('Number vot tokens: ' + _model.numVotTokens);

//       _model.numAttendees = await conf.numAttendees.call({from: this.currentUser.address});
//       console.log('Number of registered attendees: ' + _model.numAttendees);

//       this.maxNumAttendees = await conf.maxNumAttendees.call({from: this.currentUser.address});
//       _model.maxAttendees = this.maxNumAttendees;
//       console.log('Max number limit of attendees: ' + _model.maxAttendees);

//       _model.attendeeFreeSlots = _model.maxAttendees - _model.numAttendees;
//       console.log('Number of free attendee slots: ' + _model.attendeeFreeSlots);

//       _model.ticketPrice = await conf.tiketPrice.call({from: this.currentUser.address});
//       console.log('Price of the conferince ticket: ' + _model.ticketPrice);

//       _model.speakers = await conf.getSpeakerList.call({from: this.currentUser.address});
//       console.log('Speakers count: ' + _model.speakers.length);

//       const attendees = await conf.getAttendeeList.call({from: this.currentUser.address});
//       _model.attendees = attendees;
//       console.log('Attendees count: ' + _model.attendees.length);
        
//       return _model;
//     } catch (e) {
//       console.log(e);
//       this.setStatus('Error getting conference; see log.');
//     }
//   }
}