import { switchMap } from 'rxjs/operators';
import {Component, OnInit} from '@angular/core';
import {Web3Service} from '../../../util/web3.service';
import { MatSnackBar } from '@angular/material';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountModel, AccountService } from '../../../account/account.service';
import { Utilities } from '../../../util/utilities';
import { WalletService, TransactionModel } from '../../../wallet/wallet.service';
import { Globals } from '../../../globals';

declare let require: any;
const oth_artifacts = require('../../../../../build/contracts/OTH.json');

@Component({
  selector: 'app-token-sender',
  templateUrl: './token-sender.component.html',
  styleUrls: ['./token-sender.component.css']
})
export class TokenSenderComponent implements OnInit {
  accounts$: Observable<AccountModel[]>;
  OTH: any;
  currentUser: AccountModel;

  model = {
    address:'',
    amount: 0.00,
    amountType: "eth",
    symbol: "OTH",
    tokenname: "",
    decimals: 0,
    receiver: '',
    balance: 0.00,
    balanceEth: 0,
    isTtransfer: false
  };

  status = '';

  constructor(private web3Service: Web3Service, 
    private walletService: WalletService,
    private accountService: AccountService, 
    private globals: Globals,
    private matSnackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router) {
    console.log('Constructor: ' + web3Service);
    console.log('Constructor: ' + accountService);
  }

  ngOnInit(): void {
    this.currentUser = this.accountService.getCurrentUser();
    
    this.accounts$ = this.route.paramMap.pipe(
        switchMap((params: ParamMap) => {
          return this.accountService.getAccounts();
        })
      );
    this.model.address = this.route.snapshot.paramMap.get('id');
    
    console.log('OnInit');
    console.log(this);

    this.web3Service.artifactsToContract(oth_artifacts)
      .then(async (OthAbstraction) => {
        this.OTH = OthAbstraction;        
        console.log(this.OTH);        

      }).then(async() => {
        const token = await this.OTH.at(this.model.address);
        this.model.decimals = await token.decimals.call({from: this.currentUser.address});
        console.log('Token decimals: ' + this.model.decimals);
        this.model.symbol = await token.symbol.call({ from: this.currentUser.address });
        console.log('Token symbol: ' + this.model.symbol);
        this.model.tokenname = await token.name.call({ from: this.currentUser.address });
        console.log('Token name: ' + this.model.tokenname);
      }).catch((err) =>{
        console.log(err);
      });
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  transfer(){
    
    if(this.model.amountType == "eth"){
        if(this.model.balanceEth >= this.model.amount){
            this.sendEther();            
        }
        else{
            console.log("Insuficient amount.");
            this.setStatus("Insuficient amount.");
        }
    }else{
        if(this.model.balance >= this.model.amount){
            this.sendToken();            
        }
        else{
            console.log("Insuficient amount.");
            this.setStatus("Insuficient amount.");
        }
    }
  }

  async sendToken() {
    if (!this.OTH) {
      this.setStatus('OTH is not loaded, unable to send transaction');
      return;
    }
    this.model.isTtransfer = true;
    const receiver = this.model.receiver;
    
    console.log('Sending tokens ' + this.model.amount + ' to ' + receiver);
    this.setStatus('Initiating transaction... (please wait)');

    const amount = Utilities.convertToBlockchainFormat( this.model.amount, this.model.decimals);

    let transaction = await this.transferToken(this.currentUser.address, receiver, amount).catch ((error) => {
        this.model.isTtransfer = false;
        console.log(error);
        this.setStatus('Error sending token; see log.');
    });    
    if (!transaction) {
        this.model.isTtransfer = false;
        this.setStatus('Transaction failed!');
    } else {
        let newTrx:TransactionModel = { 
            hash: transaction,
            from: this.currentUser.address,
            to: this.model.address,
            tokenTransfer: {from: this.currentUser.address, to: receiver, value: this.model.amount},
            date: new Date(),
            status: "Submitted",
            value: "0"
        }
        await this.processTrx(newTrx);  
    }
  }

  async processTrx(trx){
   
    this.walletService.setTransactionToStorage(this.globals.networkId, trx);

    this.setStatus('Transaction submited! Wait the block');
    console.log("Wait mine the block");
    const rec = await this.web3Service.waitBlock(trx.hash);
    this.model.isTtransfer = false;
    
    let trxStorage = this.walletService.getTransactionFromStorage(this.globals.networkId, trx.hash);
    trxStorage.status = rec.status ? "Confirmed" : "Failed";
    if(!rec.status){
        this.setStatus("Transaction mined but execution failed");
    }
    else this.setStatus('Transaction confirmed!');   

    this.model.amount = 0;
    this.model.isTtransfer = false;
    
    this.refreshBalance();
    this.walletService.setTransactionToStorage(this.globals.networkId, trxStorage);
  }

  async transferToken(from, to, amount) {
    const deployedToken = await this.OTH.at(this.model.address);
    const gas = await deployedToken.transfer.estimateGas(to, amount, {from: from});
    console.log("Estimate gas: " + gas);
    return await deployedToken.transfer.sendTransaction(to, amount, {from: from, gas: gas});
  }

  async sendEther(){
    this.model.isTtransfer = true;
    const receiver = this.model.receiver;
    
    console.log('Sending ether ' + this.model.amount + ' to ' + receiver);
    this.setStatus('Initiating transaction... (please wait)');

    let value = this.web3Service.toWei(this.model.amount, 'ether');

    let transactionObject = {
        from: this.currentUser.address,
        to: receiver,
        value: value,
        gas: null
    };

    this.web3Service.estimateGas(transactionObject, (err, gas) => {
        if (err != null) {
            this.model.isTtransfer = false;
            console.warn('There was an error getting estimted gas.');
            console.error(err);
            this.setStatus("There was an error getting estimted gas. See logs")
            return;
        }
        console.log("EstimateGas: " + gas);
        transactionObject.gas = gas;
        
        this.web3Service.sendTransaction(transactionObject, async (err, trxHash) => {
            if(err){
                this.model.isTtransfer = false;
                console.log(err);
                this.setStatus('Error sending ether; see log.');
                return;
            }

            if (!trxHash) {
                this.model.isTtransfer = false;
                this.setStatus('Transaction failed!'); 
                return; 
            }
        
            let newTrx:TransactionModel = { 
                hash: trxHash,
                from: transactionObject.from,
                to: transactionObject.to,
                tokenTransfer: null,
                date: new Date(),
                status: "Submitted",
                value: this.model.amount.toString()
            }
            await this.processTrx(newTrx);  

        }).catch((error) => {
            this.model.isTtransfer = false;
            console.log(error);
            this.setStatus('Error sending ether; see log.');
        });
    });
    
  }

  async getOthBalance(tokenAddress, receiver, from) {
    const token = await this.OTH.at(tokenAddress);
    console.log(token);

    return await token.balanceOf.call(receiver, {from: from});
  }

  async refreshBalance() {

    try {
      console.log('Refreshing balance');

      const balance = await this.getOthBalance(this.model.address, this.model.receiver, this.currentUser.address);
      console.log('Token Balance(wei): ' + balance);

      if (this.model.decimals > 16) {
        this.model.balance = Number(this.web3Service.fromWei(balance, "ether"));
      } else {
        this.model.balance = Utilities.convertFromBlockchainFormat(balance, this.model.decimals);
      }

      console.log('Token Balance(oth): ' + this.model.balance);

      this.web3Service.getBalance(this.model.receiver).then(b => {
        console.log("Balance(wei): " + b);
        const eth = this.web3Service.fromWei(b, "ether");
        console.log("Balance(ether): " + eth);
        this.model.balanceEth = Number(eth);
      });

    } catch (e) {
      console.log(e);
      this.setStatus('Error getting balance; see log.');
    }
  }
}
