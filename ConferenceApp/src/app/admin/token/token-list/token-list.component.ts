import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { Observable, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Web3Service } from '../../../util/web3.service';

import { TokenEntity, TokenService, TokenModel } from '../../../token.service';
import { AccountModel, AccountService } from '../../../account/account.service';
import { Utilities } from '../../../util/utilities';

declare let require: any;
const oth_artifacts = require('../../../../../build/contracts/OTH.json');

@Component({
  selector: 'app-token-list',
  templateUrl: './token-list.component.html',
  styleUrls: ['./token-list.component.css']
})
export class TokenListComponent implements OnInit {
    OTH:any;
    tokens$: Observable<TokenEntity[]>;
    model = new Subject<TokenModel[]>();
    currentUser: AccountModel;
    totalSupply = "0";
    resourcesLoaded = true;

    displayedColumns = ['name', 'totalSupply', 'symbol', 'owner', 'decimals'];

  constructor(private web3Service: Web3Service,
              private accountService: AccountService, 
              private tokenService: TokenService,
              private matSnackBar: MatSnackBar,
              private route: ActivatedRoute) { }
  
  ngOnInit() {
    console.log('OnInit: ');
    console.log(this); 

    this.currentUser = this.accountService.getCurrentUser();
    this.resourcesLoaded = false;
    this.tokens$ = this.route.paramMap.pipe(
        switchMap((params: ParamMap) => {  
            return this.tokenService.getTokensByOwner(this.currentUser.address);
        })
    );

    this.web3Service.artifactsToContract(oth_artifacts).then((OTHAbstraction) => {        
        this.OTH = OTHAbstraction;
        this.tokens$.subscribe(async t => {
            console.log(t);
            let _model = await this.loadTokens(t);
            this.model.next(_model);   
            this.resourcesLoaded = true;         
        });
    });
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  async loadTokens(tokens) {
    console.log('Load token list');

    try {
      let models: TokenModel[] = [];
      for(var i = 0; i < tokens.length; i++){
        const item = tokens[i];
        const deployedOTH = await this.OTH.at(item.address, {from: this.currentUser.address}).then(instance => {
            console.log(instance);
            return instance;
        }).catch(function(err) {
            console.log(err);
            return null;
        });

        if(!deployedOTH) continue;

        console.log(deployedOTH);

        let _model = new TokenModel();
        _model.address = item.address;

        const owner = await deployedOTH.owner.call({from: this.currentUser.address});
        console.log('Owner: ' + owner);

        this.accountService.getAccount(owner)
            .subscribe(acc => {
                _model.owner = new AccountModel(acc.address, acc.publicKey, acc.privateKey, acc.firstName, acc.lastName)
            });

        _model.mintreceiver = _model.owner;
        
        _model.name = await deployedOTH.name.call({from: this.currentUser.address});
        console.log('Token name: ' + _model.name);

        _model.decimals = await deployedOTH.decimals.call({from: this.currentUser.address});
        console.log('Token decimals: ' + _model.decimals);

        _model.symbol = await deployedOTH.symbol.call({from: this.currentUser.address});
        console.log('Token symbol: ' + _model.symbol);

        const othTotalSupply = await deployedOTH.totalSupply.call({from: this.currentUser.address});
        console.log(othTotalSupply);
        
        if(_model.decimals > 16){
            _model.totalSupply = this.web3Service.fromWei(othTotalSupply, "ether");
        }else{
            _model.totalSupply = Utilities.convertFromBlockchainFormat(othTotalSupply, _model.decimals);
        }

        console.log('totalSupply: ' + _model.totalSupply);
        _model.strSupply = Utilities.stringifyBalance(othTotalSupply, _model.decimals);
        console.log('strSupply: ' + _model.strSupply);

        models.push(_model);

      }

      return models;

    } catch (e) {
      console.log(e);
      this.setStatus('Error loading tokens; see log.');
    }
  }

}
