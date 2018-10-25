import { Injectable } from '@angular/core';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators';
import { AccountModel } from './account/account.service';
import { Utilities } from './util/utilities';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Globals } from './globals';


export class TokenEntity{
    address: string;
    created: Date
    createdBy: string;
    netId: number;
}

export class TokenModel {
    address: string;
    name: string;    
    decimals: number;
    symbol: string;
    owner: any;
    totalSupply: number;
    strSupply:string;
    created: Date;
    mint: number;
    mintreceiver: string
  };

  export const MockTokenModel: TokenModel = {
    address: '0x05bf482b5f997f7d6c995ed461fa1701b28ad43d',
    name: "",    
    decimals: 0,
    symbol: "",
    owner: "",
    totalSupply: 0,
    strSupply: '0',
    created: new Date(),
    mint: 0,
    mintreceiver: ""
  };

  export let TOKENS: TokenEntity[] = [
    {
        address: "0x9AAaEfE3CF4E6015C28BE4caC6303A7637d294C3",
        created: new Date("Jule 12, 2018 5:32:29 GMT+03:00"),
        createdBy: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
        netId: 5777
    }//,
    // {
    //     address: "0x9AAaEfE3CF4E6015C28BE4caC6303A7637d294C3",
    //     created: new Date("June 29, 2018 9:34:16 AM GMT+03:00"),
    //     createdBy: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
    //     netId: 4
    // }
    // {
    //     address: "0x05bf482b5f997f7d6c995ed461fa1701b28ad43d",
    //     created: new Date(2018, 6, 1),
    //     createdBy: "0x2205c02320d9ee8cf79afa6dca823b2c46399884"
    // },
    // {
    //     address: "0xb5b861e5f0343745c73ac00bc661d5a2e5824cb5",
    //     created: new Date(2018, 6, 22),
    //     createdBy: "0x4410e253DE7631481c939464c310B7c2b18D5FCa"
    // },
    // {
    //     address: "0x955ceaa63e45aa4b86ca442df39e05eb769f71a0",
    //     created: new Date(2018, 6, 22),
    //     createdBy: "0x4410e253DE7631481c939464c310B7c2b18D5FCa"
    // },
    // {
    //     address: "0xD86D9BE8a09f6f951b8AA931946D5D2e80879A86",
    //     created: new Date(2018,6,22),
    //     createdBy: "0x2205c02320d9ee8cf79afa6dca823b2c46399884"
    // },
    // {
    //     address: "0x793256fe9c0f31bf5945f1589861a58b70c89bc1",
    //     created: new Date(2018, 6, 19),
    //     createdBy: "0x2205c02320d9ee8cf79afa6dca823b2c46399884"
    // },
    // {
    //     address: "0xb653679f1150cd3568afb3b68b763161d84ff2c9",
    //     created: new Date(2018, 6, 22),
    //     createdBy: "0x2205c02320d9ee8cf79afa6dca823b2c46399884"
    // },
    // {
    //     address: "0x297c16c5d4ee42ffdb68dface096c5e8f18d8c9d",
    //     created: new Date(2018, 6, 22),
    //     createdBy: "0x2205c02320d9ee8cf79afa6dca823b2c46399884"
    // }
];

@Injectable()
export class TokenService {

    tokens: Observable<TokenEntity[]>;
    jsonUrl = "../assets/token.json"; 

    constructor(private http: HttpClient, private globals: Globals){
       // console.log("Load json");
        //this.load();
    }

    getJSON(): Observable<any> {
        return this.http.get(this.jsonUrl);
    }

    setJSON(): Observable<any> {
        var jsonStr = JSON.stringify(this.tokens);
        return this.http.post<any>(this.jsonUrl, jsonStr);
    }
  
    // getTokens() { 
    //     return of(TOKENS); 
    // }

    getTokens() {
        const tokens = TOKENS.filter(token => token.netId == this.globals.networkId);
        return of(tokens);

        // return this.getTokens().pipe(
        //     map(tokens => tokens.filter(token => token.netId == netId))
        // );
    }

  getTokensByOwner(owner: string) {
    return this.getTokens().pipe(
      map(tokens => tokens.filter(token => token.createdBy.toLowerCase() === owner.toLowerCase()))
    );
  }

  getToken(address: string) {
    return this.getTokens().pipe(
      map(tokens => tokens.find(token => token.address.toLowerCase() === address.toLowerCase()))
    );
  }

  addToken(address, created, createdBy){
      let te = new TokenEntity();
      te.address = address;
      te.created = created;
      te.createdBy = createdBy;
      te.netId = this.globals.networkId;

      TOKENS.push(te);
  }

  save(){
     this.setJSON();
  }

  load(){
    this.tokens = this.getJSON();
    this.tokens.subscribe(data => {
        console.log(data);
    });
  }

  async loadDetails(tokenIns, from) {
      let _model = new TokenModel();

      const owner = await tokenIns.owner.call({from: from});
      console.log('Owner: ' + owner);
      _model.owner = new AccountModel(owner, "", "", "", "");

      _model.name = await tokenIns.name.call({from: from});
      console.log('Token name: ' + _model.name);

      _model.decimals = await tokenIns.decimals.call({from: from});
      console.log('Token decimals: ' + _model.decimals);

      _model.symbol = await tokenIns.symbol.call({from: from});
      console.log('Token symbol: ' + _model.symbol);

      const othTotalSupply = await tokenIns.totalSupply.call({from: from});
      console.log('Total supply: ' + othTotalSupply);

      _model.totalSupply = Utilities.convertFromBlockchainFormat(othTotalSupply, _model.decimals);
      console.log('Formated Total supply: ' + _model.totalSupply);

      _model.strSupply = Utilities.stringifyBalance(othTotalSupply, _model.decimals);
      console.log('Total supply to string: ' + _model.strSupply);

      return _model;
  }
}

