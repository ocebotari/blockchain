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
  selector: 'app-oth-details',
  templateUrl: './oth-details.component.html',
  styleUrls: ['./oth-details.component.css']
})
export class TokenDetailsComponent implements OnInit {
  OTH: any;
  currentUser: AccountModel;
  accounts$: Observable<AccountModel[]>;
  token$: Observable<TokenEntity>;
  model: TokenModel = new TokenModel();
  balanceModel = {
    address: '0x2205c02320d9ee8Cf79afA6DCA823b2C46399884',
    balance: 0.00,
    balanceEth: 0.00
  };

  status = '';

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
    //this.mintModel.receiver = this.currentUser.address;

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
            this.model.created = t.created;
            console.log(this.model.created);
        
            //return await this.setMintEvents(t.address);
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
        const deployedOTH = await this.OTH.at(address, { from: this.currentUser.address });
        console.log(deployedOTH);

        let _model = new TokenModel();
        _model.address = address;

        const owner = await deployedOTH.owner.call({ from: this.currentUser.address });
        console.log('Owner: ' + owner);

        this.accountService.getAccount(owner)
            .subscribe(acc => {
                _model.owner = new AccountModel(acc.address, acc.publicKey, acc.privateKey, acc.firstName, acc.lastName);
            });

        _model.mintreceiver = _model.owner.address;

        _model.name = await deployedOTH.name.call({ from: this.currentUser.address });
        console.log('Token name: ' + _model.name);

        _model.decimals = await deployedOTH.decimals.call({ from: this.currentUser.address });
        console.log('Token decimals: ' + _model.decimals);

        _model.symbol = await deployedOTH.symbol.call({ from: this.currentUser.address });
        console.log('Token symbol: ' + _model.symbol);

        const othTotalSupply = await deployedOTH.totalSupply.call({ from: this.currentUser.address });
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

  async refreshBalance() {

    try {
      console.log('Refreshing balance');

      const token = await this.OTH.at(this.model.address, { from: this.currentUser.address });
      console.log(token);
      const balance = await token.balanceOf.call(this.balanceModel.address, {from: this.currentUser.address});
      console.log('Token Balance(wei): ' + balance);

      if (this.model.decimals > 16) {
        this.balanceModel.balance = Number(this.web3Service.fromWei(balance, "ether"));
      } else {
        this.balanceModel.balance = Utilities.convertFromBlockchainFormat(balance, this.model.decimals);
      }

      console.log('Token Balance(oth): ' + this.balanceModel.balance);

      this.web3Service.getBalance(this.balanceModel.address).then(b => {
        console.log("Balance(wei): " + b);
        const eth = this.web3Service.fromWei(b, "ether");
        console.log("Balance(ether): " + eth);
        this.balanceModel.balanceEth = Number(eth);
      });

    } catch (e) {
      console.log(e);
      this.setStatus('Error getting balance; see log.');
    }
  }
}
