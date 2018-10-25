import { switchMap } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../../util/web3.service';
import { MatSnackBar } from '@angular/material';
import { Observable } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { TokenModel, TokenService, TokenEntity } from '../../../token.service';
import { AccountService, AccountModel } from '../../../account/account.service';
import { Utilities } from '../../../util/utilities';

declare let require: any;
const oth_artifacts = require('../../../../../build/contracts/OTH.json');

@Component({
  selector: 'app-mint-details',
  templateUrl: './token-mint.component.html',
  styleUrls: ['./token-mint.component.css']
})
export class TokenMintComponent implements OnInit {
  OTH: any;
  currentUser: AccountModel;
  accounts$: Observable<AccountModel[]>;
  token$: Observable<TokenEntity>;
  model: TokenModel = new TokenModel();

  minting = false;
  status = '';

  mintEvent: any;
  finishMintingEvent: any;

  mintModel = {
    amount: 0.00,
    receiver: ""
  }

  constructor(private web3Service: Web3Service, 
    private accountService: AccountService, 
    private matSnackBar: MatSnackBar, 
    private tokenService: TokenService,
    private route: ActivatedRoute) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit(): void {
    console.log('OnInit: ' + this.web3Service);
    console.log(this);

    this.currentUser = this.getCurrentUser();
    this.mintModel.receiver = this.currentUser.address;

    this.accounts$ = this.route.paramMap.pipe(
        switchMap((params: ParamMap) => {
          return this.accountService.getAccounts();
        })
      );

    this.token$ = this.route.paramMap.pipe(
        switchMap((params: ParamMap) => {
          return this.tokenService.getToken(params.get('id'));
        })
    );
    //this.watchAccount();
    console.log(oth_artifacts);
    this.web3Service.artifactsToContract(oth_artifacts).then((OTHAbstraction) => {        
        this.OTH = OTHAbstraction;
        this.token$.subscribe(async t => {
            this.model = await this.getDetails(t.address);
            return await this.setMintEvents(t.address);
        });
      });
  }

  getCurrentUser() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if(user)
        return new AccountModel(user.address, user.publicKey, user.privateKey, user.firstName, user.lastName);
    else return null;
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  async getDetails(address) {
    console.log('Get token parameters');

    try {
      const deployedOTH = await this.OTH.at(address, {from: this.currentUser.address});
      console.log(deployedOTH);

      let _model = new TokenModel();
      _model.address = address;

      const owner = await deployedOTH.owner.call({from: this.currentUser.address});
        console.log('Owner: ' + owner);

        this.accountService.getAccount(owner)
            .subscribe(acc => {
                _model.owner = new AccountModel(acc.address, acc.publicKey, acc.privateKey, acc.firstName, acc.lastName)
            });

      _model.mintreceiver = _model.owner.address;
      
      _model.name = await deployedOTH.name.call({from: this.currentUser.address});
      console.log('Token name: ' + _model.name);

      _model.decimals = await deployedOTH.decimals.call({from: this.currentUser.address});
      console.log('Token decimals: ' + _model.decimals);

      _model.symbol = await deployedOTH.symbol.call({from: this.currentUser.address});
      console.log('Token symbol: ' + _model.symbol);

      const othTotalSupply = await deployedOTH.totalSupply.call({from: this.currentUser.address});
      console.log('Total supply: ' + othTotalSupply);
      if (_model.decimals > 16) {
        _model.totalSupply = this.web3Service.fromWei(othTotalSupply, "ether");
      } else {
        _model.totalSupply = Utilities.convertFromBlockchainFormat(othTotalSupply, _model.decimals);
      }
      return _model;

    } catch (e) {
      console.log(e);
      this.setStatus('Error getting token details; see log.');
    }
  }

  async setMintEvents(address){
    if (!this.OTH) {
        this.setStatus('OTH is not loaded, unable to send transaction');
        return;
    }

    console.log("Set Mint events.");

    try {
        const deployedOTH = await this.OTH.at(address, {from: this.currentUser.address});
        this.mintEvent = await deployedOTH.Mint();       
        this.finishMintingEvent = await deployedOTH.MintFinished();
        // this.mintEvent.stopWatching((err, res) => 
        //     err ? console.log(err) : this.setStatus('Stopped watching!'));

        // this.watchMintEvents();
        
      } catch (e) {
        console.log(e);
        this.setStatus('Error setting events; see log.');
      }
  }

  watchMintEvents(){
    this.mintEvent.watch((error, result) => {
        if(error){
            this.setStatus('Minting OTHs failed!');
            console.log(error);
            return;
        }
        console.log("Mint event watch result");
        console.log(result);
        console.log('Amount: ' + result.args.amount);
        let val;
        if (this.model.decimals > 16) {
            val = this.web3Service.fromWei(result.args.amount, "ether");
        } else {
            val = Utilities.convertFromBlockchainFormat(result.args.amount, this.model.decimals);
        }
        
        this.setStatus('Minting ' + val  + ' OTHs' + ' to ' + result.args.to + ' completed!');        
    });

    this.finishMintingEvent.watch((error) => {
        if(!error)
            this.setStatus('Finish Minting completed!');
        else 
            this.setStatus('Finish Minting failed.');
    });
  }

  async mintOth() {
    if (!this.OTH) {
      this.setStatus('OTH is not loaded, unable to send transaction');
      return;
    }

    if(this.mintModel.amount == 0){
        this.setStatus("Amount is required.");
        return;
    }

    if(this.mintModel.receiver == ""){
        this.setStatus("Receiver is required");
        return;
    }
        
    try {

      this.minting = true;

      console.log('Minting OTHs ' + this.mintModel.amount + ' to ' + this.mintModel.receiver);

      this.setStatus('Initiating transaction... (please wait)');

      let amount = Utilities.convertToBlockchainFormat(this.mintModel.amount, this.model.decimals);
      
      const receiver = this.mintModel.receiver;
      console.log("Minting amount: " + amount);

      const deployedOTH = await this.OTH.at(this.model.address, {from: this.currentUser.address});
      const transaction = await deployedOTH.mint.sendTransaction(receiver, amount, {from: this.currentUser.address});

      if (!transaction) {
        this.minting = false;
        this.setStatus('Transaction failed!');
      } else {
        this.setStatus('Transaction submitted! Wait the block');
        console.log("Wait mine the block");
        this.web3Service.waitBlock(transaction).catch(e => {
            this.minting = false; 
            console.log(e);
            this.setStatus('Transaction failed!');
        }).then(() => {
            this.minting = false;
            this.setStatus('Transaction confirmed!');
        });     
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error sending oth; see log.');
      this.minting = false;
    }
  }

  async finishMint() {
    if (!this.OTH) {
      this.setStatus('OTH is not loaded, unable to send transaction');
      return;
    }

    console.log('Finish Minting OTHs');

    this.setStatus('Initiating transaction... (please wait)');
    try {
      const deployedOTH = await this.OTH.at(this.model.address, {from: this.currentUser.address});
      const transaction = await deployedOTH.finishMinting.sendTransaction({from: this.currentUser.address});

      if (!transaction) {
        this.setStatus('Transaction failed!');
      } else {
        this.setStatus('Transaction complete!');
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error sending oth; see log.');
    }
  }
}
