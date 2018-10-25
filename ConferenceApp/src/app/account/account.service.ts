import { Injectable } from '@angular/core';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators';

import { Account } from 'web3/types';

interface IAccountModel extends Account{
    
    firstName: string;
    lastName: string;
    fullName();
}

export class AccountModel implements IAccountModel{
    
    constructor(public address: string, 
        public publicKey: string,
        public privateKey: string,
        public firstName: string,
        public lastName: string){
            this.balance = "0.000";
            this.balanceEth = "0.000";
        }
    
    balance: string;
    balanceEth: string;
    fullName(){
        return this.firstName + " " + this.lastName;     
    }
}

// export class Organizer extends AccountModel{
// }

export class Speaker extends AccountModel{
    voteCount: number;

    constructor(public id: number,
        public address: string, 
        public publicKey: string,
        public privateKey: string,
        public firstName: string,
        public lastName: string){
            super(address, publicKey, privateKey, firstName, lastName);
            this.voteCount = 0;
    }
}

export class Attendee extends AccountModel{
    availableVotingTokens: number;
    consumedVotingTokens: number;
    voteCount: number;
    rewardedTokens: number;
}

// export class Attendee extends AccountModel{
//     numVoteTokens: number;
//     MyEvents: string[]
// }

export class VoteReceived extends AccountModel {
    id: number;
    address: string;
    count: number;
}

export const ADMIN_ADDRESS = [
    "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
    "0x4410e253DE7631481c939464c310B7c2b18D5FCa"
]

const ATTENDEES: AccountModel[] = [
    {
        address: "0xf776e9be02f42ba3a436f9427853a4bfe4337778",
        firstName: "Account 2",
        lastName: "Account 2",
        publicKey: "",
        privateKey: "0x7113a4bc6dc5f9be681c87c15080386f4d764c64acc608d48f7311f676618962",
        balance: "0",
        balanceEth: "0",
        fullName(){
            return this.firstName + " " + this.lastName;     
        }
    },
    {
        address: "0xfd31a07E9D2722ef16e0d6A3d4072c96780E318A",
        firstName: "Account 3",
        lastName: "Account 3",
        publicKey: "",
        privateKey: "0xa8b5b63cc35aaa31ff3ae1507f7a13dcb38a6e6a90e59eacadeb1da15ea6bbe4",
        balance: "0",
        balanceEth: "0",
        fullName(){
            return this.firstName + " " + this.lastName;     
        }
    },
    {
        address: "0x4410e253DE7631481c939464c310B7c2b18D5FCa",
        firstName: "Account 4",
        lastName: "Account 4",
        publicKey: "",
        privateKey: "0xf0cf724b34c960359a63bf9c8e5bd5f181548cef29df59037f779db9633f0cca",
        balance: "0",
        balanceEth: "0",
        fullName(){
            return this.firstName + " " + this.lastName;     
        }
    }
];

const SPEAKERS: Speaker[] = [{
    id: 1,
    voteCount: 0,
    address: "0x7af5A826ba33a4Ee5692950e94E1861f048Ee380",
    firstName: "Account 10",
    lastName: "Account 10",
    publicKey: "",
    privateKey: "0xd56122967d4c844ecc487873321cfbc31b6ac47cbab431c1484a33de60e4d6aa",
    balance: "0",
    balanceEth: "0",
    fullName(){
        return this.firstName + " " + this.lastName;     
    }
},
{
    id: 2,
    voteCount: 0,
    address: "0x8100753B07A5c0704D1c974F6D8e924eB55DE952",
    firstName: "Account 9",
    lastName: "Account 9",
    publicKey: "",
    privateKey: "0x690771e17a0360153c2a2a011999cbbc8ba7705db8a4c96fd0882591e51cd67d",
    balance: "0",
    balanceEth: "0",
    fullName(){
        return this.firstName + " " + this.lastName;     
    }
}];

const ACCOUNTS: AccountModel[] = [{
    address: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
    firstName: "Account 1",
    lastName: "Account 1",
    publicKey: "",
    privateKey: "0x5e2fe80c2b9bbb37689422e3f904a876dddf4d7258a1dd7a2efbd3dba3e25b7f",
    balance: "0",
    balanceEth: "0",
    fullName(){
        return this.firstName + " " + this.lastName;     
    }
},
{
    address: "0xf776e9be02f42ba3a436f9427853a4bfe4337778",
    firstName: "Account 2",
    lastName: "Account 2",
    publicKey: "",
    privateKey: "0x7113a4bc6dc5f9be681c87c15080386f4d764c64acc608d48f7311f676618962",
    balance: "0",
    balanceEth: "0",
    fullName(){
        return this.firstName + " " + this.lastName;     
    }
},
{
    address: "0xfd31a07E9D2722ef16e0d6A3d4072c96780E318A",
    firstName: "Account 3",
    lastName: "Account 3",
    publicKey: "",
    privateKey: "0xa8b5b63cc35aaa31ff3ae1507f7a13dcb38a6e6a90e59eacadeb1da15ea6bbe4",
    balance: "0",
    balanceEth: "0",
    fullName(){
        return this.firstName + " " + this.lastName;     
    }
},
{
    address: "0x4410e253DE7631481c939464c310B7c2b18D5FCa",
    firstName: "Account 4",
    lastName: "Account 4",
    publicKey: "",
    privateKey: "0xf0cf724b34c960359a63bf9c8e5bd5f181548cef29df59037f779db9633f0cca",
    balance: "0",
    balanceEth: "0",
    fullName(){
        return this.firstName + " " + this.lastName;     
    }
},
{
    address: "0x7308Ce62bb0269CD38e35deb7B741Fd8689ef70F",
    firstName: "Account 5",
    lastName: "Account 5",
    publicKey: "",
    privateKey: "0xbc20c1783231b7f60ad2c317f98c909002e046c643f62a46c7c658bd8678863e",
    balance: "0",
    balanceEth: "0",
    fullName(){
        return this.firstName + " " + this.lastName;     
    }
},
{
    address: "0x00409dF20E7600A2CCd86AA6bd874906fE9607c1",
    firstName: "Account 6",
    lastName: "Account 6",
    publicKey: "",
    privateKey: "0xa6f8269e53cd448b345e534da97960d77417788db8692144a566acc07c695f17",
    balance: "0",
    balanceEth: "0",
    fullName(){
        return this.firstName + " " + this.lastName;     
    }
},
{
    address: "0x4432B0A8F4C252d1fB9238Ac79C6f0bd7641d982",
    firstName: "Account 7",
    lastName: "Account 7",
    publicKey: "",
    privateKey: "0x70e27330ad7f4da5488d7bbe59da9e8ee2ca3a3f0d0ee1e90f4198dc9a96b4ec",
    balance: "0",
    balanceEth: "0",
    fullName(){
        return this.firstName + " " + this.lastName;     
    }
},
{
    address: "0x4f7aaC078A23a5Fb2793EE31267E89c3756614b0",
    firstName: "Account 8",
    lastName: "Account 8",
    publicKey: "",
    privateKey: "0x5dda811b8558fdfdb755f7e2e4592f6ca7e57a4e9b1cf71fb9568df0c8dbed25",
    balance: "0",
    balanceEth: "0",
    fullName(){
        return this.firstName + " " + this.lastName;     
    }
},
{
    address: "0x8100753B07A5c0704D1c974F6D8e924eB55DE952",
    firstName: "Account 9",
    lastName: "Account 9",
    publicKey: "",
    privateKey: "0x690771e17a0360153c2a2a011999cbbc8ba7705db8a4c96fd0882591e51cd67d",
    balance: "0",
    balanceEth: "0",
    fullName(){
        return this.firstName + " " + this.lastName;     
    }
},
{
    address: "0x7af5A826ba33a4Ee5692950e94E1861f048Ee380",
    firstName: "Account 10",
    lastName: "Account 10",
    publicKey: "",
    privateKey: "0xd56122967d4c844ecc487873321cfbc31b6ac47cbab431c1484a33de60e4d6aa",
    balance: "0",
    balanceEth: "0",
    fullName(){
        return this.firstName + " " + this.lastName;     
    }
}];

@Injectable()
export class AccountService {
  DEFAULT_ACCOUNT = "0x2205c02320d9ee8cf79afa6dca823b2c46399884";

  getAccounts() { return of(ACCOUNTS); }

  getAccount(address: string) {
    return this.getAccounts().pipe(
      // (+) before `id` turns the string into a number
      map(accounts => accounts.find(account => account.address.toLowerCase() === address.toLowerCase()))
    );
  }

  isAdmin(address){

    if(ADMIN_ADDRESS.find(a => a.toLowerCase() == address.toLowerCase())){
          return true;
    }

    return false;
  }

  addAccount(address, fname, lname, privateKey){
      this.getAccounts().pipe(          
          map(accounts => {
              let a = new AccountModel(address, "", privateKey, fname, lname)
              accounts.push(a);
            })
      );
  }

  getDefaultAccount() {
      return this.getAccount(this.DEFAULT_ACCOUNT);
  }

  getCurrentUser() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if(user)
        return new AccountModel(user.address, user.publicKey, user.privateKey, user.firstName, user.lastName);
    else return null;
  }

  getSpeakers() { return of(SPEAKERS); }

  getSpeaker(address: string) {
    return this.getSpeakers().pipe(
      map(speakers => speakers.find(s => s.address.toLowerCase() === address.toLowerCase()))
    );
  }

  getAttendees() { return of(ATTENDEES); }

  getAttendee(address) {
    return this.getAttendees().pipe(
      map(attendees => attendees.find(a => a.address.toLowerCase() === address.toLowerCase()))
    );
  }

}