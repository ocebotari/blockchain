import { Injectable } from '@angular/core';
import { of } from 'rxjs/observable/of';
import { Utilities } from '../util/utilities';
import { Globals } from '../globals';


export const WALLET_TOKENS = [
    "0x05bf482b5f997f7d6c995ed461fa1701b28ad43d",
    "0x05bf482b5f997f7d6c995ed461fa1701b28ad43d",
    "0x793256fe9c0f31bf5945f1589861a58b70c89bc1",
    "0xF065B9C7F7C288E092c6665CE3f664096343bC96",
    "0x793256fe9c0f31bf5945f1589861a58b70c89bc1"
];

export class TransactionBase {
    hash: string;
    formatedHash: string;
    bStatus: boolean;
    blockHash: string;
    blockNumber: number;
    transactionIndex: number;
    from: string;
    to: string;
    date: Date;
    status:string;

    setStatus(){
        this.status = this.bStatus ? "Success" : "Failed";
    }
    setFormatedHash(plen: number, slen: number, delimeter: string) {
        this.formatedHash = Utilities.wrapAddress(this.hash, plen, slen, delimeter);
    }
}

export class Transaction extends TransactionBase{
    nonce: number;
    value: string;
    formatedValue: string;
    gasPrice: string;
    gas: number;
    input: string;
}

export class TransactionReceipt {
    contractAddress: string;
    cumulativeGasUsed: number;
    gasUsed: number;
    logs: Array<any>;
}

export class TransactionModel {
    hash: string;
    from: string;
    to: string;
    tokenTransfer: {};
    date: Date;
    status:string;
    value: string;
}

export const TRANSACTIONS: TransactionModel[] = [
    {
        hash: "0xb1d6c66d2f6f2479b8f6e4c740197f0c1b6604d1b514f9bd9bc10de7af181d58",
        from: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
        to: "0xE744783cFF6e26284746bbCB2f37694634365D92",
        tokenTransfer: null,
        date: new Date("June 29, 2018 17:46:29 GMT+03:00"),
        status:"Confirmed",
        value: "0",
    },
    {
        hash: "0xa28fe3ce1f3ac017f0814a3e2451ca1d6cd963b8327098cd899bdd32cb9afb3c",
        from: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
        to: "0xE744783cFF6e26284746bbCB2f37694634365D92",
        tokenTransfer: null,
        date: new Date("June 29, 2018 17:44:29 GMT+03:00"),
        status:"Confirmed",
        value: "0",
    },
    {
        hash: "0xc01b449453846f7a8aea48d581c42d40274de75840d4db8811e0ffaea0012dc0",
        from: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
        to: "0xE744783cFF6e26284746bbCB2f37694634365D92",
        tokenTransfer: null,
        date: new Date("June 29, 2018 17:41:29 GMT+03:00"),
        status:"Confirmed",
        value: "0",
    },
    {
        hash: "0x98f22f21fc2e094f547fcb1ac63c6331551a6da6c7dd6e98b25dc6bde22361ea",
        from: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
        to: "0xE744783cFF6e26284746bbCB2f37694634365D92",
        tokenTransfer: null,
        date: new Date("June 29, 2018 17:33:29 GMT+03:00"),
        status:"Confirmed",
        value: "0",
    },
    {
        hash: "",
        from: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
        to: "0xE744783cFF6e26284746bbCB2f37694634365D92",
        tokenTransfer: null,
        date: new Date("June 29, 2018 13:43:29 GMT+03:00"),
        status:"Rejected",
        value: "0",
    },
    { 
        hash: "0x31e0983c502a85f30d2ed0095d863ee52e48381ce49092923e2e9d5548ae2f28",
        from: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
        to: "0x9AAaEfE3CF4E6015C28BE4caC6303A7637d294C3",
        tokenTransfer: {from: "0x2205c02320d9ee8cf79afa6dca823b2c46399884", to: "0x4410e253de7631481c939464c310b7c2b18d5fca", value: 10},
        date: new Date("June 29, 2018 11:50:29 GMT+03:00"),
        status: "Confirmed",
        value: "0"
      },
      { 
        hash: "0xa28fe3ce1f3ac017f0814a3e2451ca1d6cd963b8327098cd899bdd32cb9afb3c",
        from: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
        to: "0x9AAaEfE3CF4E6015C28BE4caC6303A7637d294C3",
        tokenTransfer: {from: "0x2205c02320d9ee8cf79afa6dca823b2c46399884", to: "0x4410e253de7631481c939464c310b7c2b18d5fca", value: 10},
        date: new Date("June 29, 2018 11:48:29 GMT+03:00"),
        status: "Confirmed",
        value: "0"
      },
      { 
        hash: "0xc01b449453846f7a8aea48d581c42d40274de75840d4db8811e0ffaea0012dc0",
        from: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
        to: "0x9AAaEfE3CF4E6015C28BE4caC6303A7637d294C3",
        tokenTransfer: {from: "0x0000000000000000000000000000000000000000", to: "0x4410e253de7631481c939464c310b7c2b18d5fca", value: 10000},
        date: new Date("June 29, 2018 09:33:29 GMT+03:00"),
        status: "Confirmed",
        value: "0"
      },
      {
        hash: "0x41e34e0b4efcfb13295a6a9e8dac0d40f3be8006fef688017caccfda938af490",
        from: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
        to: null,
        tokenTransfer: null,
        date: new Date("June 29, 2018 10:02:29 GMT+03:00"),
        status:"Confirmed",
        value: "0",
      }
]

@Injectable()
export class WalletService {

  constructor(private globals: Globals) { }
  
  getTokenAddress() { 
    let address = "";
    switch (this.globals.networkId) {
        case 1:
          //address = "0x05bf482b5f997f7d6c995ed461fa1701b28ad43d";
          console.log('This is mainnet');
          break;
        case 2:
          //address = "0x05bf482b5f997f7d6c995ed461fa1701b28ad43d";
          console.log('This is the deprecated Morden test network.');
          break;
        case 3:
          //address = "0x05bf482b5f997f7d6c995ed461fa1701b28ad43d";
          console.log('This is the ropsten test network.');
          break;
        case 4:
          address = "0x9AAaEfE3CF4E6015C28BE4caC6303A7637d294C3";
          console.log('This is the Rinkeby test network.');
          break;
        case 42:
          //address = "0x05bf482b5f997f7d6c995ed461fa1701b28ad43d";
          console.log('This is the Kovan test network.');
          break;
        case 5777:
          address = "0x9AAaEfE3CF4E6015C28BE4caC6303A7637d294C3";
          console.log('This is a private network.');
          break;
        default:
          address = "0x05bf482b5f997f7d6c995ed461fa1701b28ad43d";
          console.log('This is an unknown network.');
      }
      return address; 
    }

    getEtherscanUrl() { 
        let address = "";
        switch (this.globals.networkId) {
            case 1:
              address = "https://etherscan.io";
              console.log('This is mainnet')
              break
            case 2:
              //address = "0x05bf482b5f997f7d6c995ed461fa1701b28ad43d";
              console.log('This is the deprecated Morden test network.')
              break
            case 3:
              //address = "0x05bf482b5f997f7d6c995ed461fa1701b28ad43d";
              console.log('This is the ropsten test network.')
              break
            case 4:
              address = "https://rinkeby.etherscan.io";
              console.log('This is the Rinkeby test network.')
              break
            case 42:
              address = "https://kovan.etherscan.io";
              console.log('This is the Kovan test network.')
              break
            case 5777:
              address = "";
              console.log('This is private network.')
              break;
            default:
            console.log('This is an unknown network.')
          }
          return address; 
        }
    

    getItemFromStorage(key){
        return JSON.parse(localStorage.getItem(key));
    }

    setItemToStorage(key, trx){
        localStorage.setItem(key, JSON.stringify(trx));
    }
    
    removeItemFromStorage(key){
        localStorage.removeItem(key);
    }

    setTransactionToStorage(key, trx) {
        let trxs: Array<any> = this.getItemFromStorage(key);
        if (!trxs) {
            trxs = [];
            trxs.push(trx);
        } else {
            let index = trxs.findIndex(t => t.hash.toLowerCase() == trx.hash.toLowerCase());
            if (index >= 0) {
                trxs[index] = trx;
            } else {
                trxs.push(trx);
            }
        }

        this.setItemToStorage(key, trxs);
    }

    getTransactionFromStorage(key, hash:string){
        let trxs:Array<any> = this.getItemFromStorage(key);
        let finded:TransactionModel = trxs.find(t => t.hash.toLowerCase() == hash.toLowerCase());
        return finded;
    }

    removeTransactionFromStorage(key, hash) {
        let trxs:Array<any> = this.getItemFromStorage(key);
        let list = [];
        trxs.map(t => {
            if(t.hash.toLowerCase() != hash.toLowerCase()){
                list.push(t);
            }
        });
        this.setItemToStorage(key, list);
    }

}
