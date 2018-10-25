import { Component, OnInit, Inject } from '@angular/core';
import { Web3Service } from '../util/web3.service';
import { AccountService, AccountModel } from '../account/account.service';
import { WalletService, Transaction, TRANSACTIONS, TransactionModel } from './wallet.service';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { MatSnackBar, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TokenModel, TokenService, TokenEntity } from '../token.service';
import { Observable, Observer, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Utilities, SortDirectionEnum } from '../util/utilities';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Globals } from '../globals';
import { of } from 'rxjs/observable/of';

declare let require: any;
const token_artifacts = require('../../../build/contracts/OTH.json');

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {

  OTH:any; tokenIns:any;
  accounts$: Observable<AccountModel[]>;
  token: TokenModel;

  accountName: string;
  balanceOth = 0;
  balanceEth = 0;
  accountAddress: string;
  formatedAddress: string;
  tokenAddress: string;
  currentUser: AccountModel;

  wallet:any;
  etherscanTxUrl = "";
  etherscanAddressUrl = "";
  balanceLoaded = false;
  trxsLoading = true;
  trxSending = false;

  trxsObservable: Subject<TransactionModel[]> = new Subject<TransactionModel[]>();
  trxs: TransactionModel[] = [];
  newTrxHash:string;
  timer:any;

  displayedColumns = ['image', 'status'];
  keyEth = this.globals.networkId.toString() + "_eth";
  keyOth = this.globals.networkId.toString() + "_oth";

  constructor(
      private web3Service: Web3Service,
      private accountService: AccountService,
      private walletService: WalletService,
      private matSnackBar: MatSnackBar,
      private globals: Globals,
      public dialog: MatDialog) {

  }

  ngOnInit() {
    console.log('OnInit: ' + this.web3Service);
    console.log(this);          
    const da = this.web3Service.getDefaultAccount();
    console.log("Default account: " + da);      

    this.currentUser = this.accountService.getCurrentUser();
    console.log("Balance: " + this.currentUser.balance);

    this.wallet = this.web3Service.getWallet();
    if(this.wallet.length == 0){
        this.web3Service.addAccountToWallet(this.currentUser.privateKey);
    }

    console.log("Wallet");
    console.log(this.wallet);

    this.token = new TokenModel();
    this.token.symbol = "OTH";
    this.token.name = "Organizer Token";
    
    const sLength = 5; 
    const eLength = 5;

    this.accountName = this.currentUser.fullName();
    this.accountAddress = this.currentUser.address;
    const len = this.accountAddress.length;
    this.formatedAddress = `${this.currentUser.address.substr(0, sLength)}...${this.currentUser.address.substr(len-5, eLength)}`;

    this.tokenAddress = this.walletService.getTokenAddress();   

    this.etherscanTxUrl = `${this.walletService.getEtherscanUrl()}/tx/`;
    this.etherscanAddressUrl = `${this.walletService.getEtherscanUrl()}/address/`;
    
    this.watchAccount();
    this.onInit();
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      console.log("Accounts:");
      console.log(accounts);
    });
  }

  isCurrent(address){
    return this.accountAddress.toLowerCase() === address.toLowerCase();
  }

  async onInit() {
    const ta = await this.web3Service.artifactsToContract(token_artifacts)
    .then((tokenAbstraction) => {
        this.OTH = tokenAbstraction;
        console.log(tokenAbstraction)
    });

    if(this.tokenAddress.length > 0){
        this.tokenIns = await this.initContract(this.tokenAddress, this.OTH).catch((err) => {
            console.log(err);
            this.setStatus('Error initiating the OTH instance; see log.');
        });
    }

    if(this.tokenIns){
        this.token = await this.getDetails();
        await this.refreshBalance();
        this.refreshTransactions();
        this.trxsLoading = false;
    }
  }

  refreshTransactions(forceRefresh = false){
    const trxfromStorage = this.getAllTransactions();
    
    if(forceRefresh){
        Utilities.sortArrayByDate(trxfromStorage, SortDirectionEnum.desc);
        this.trxsObservable.next(trxfromStorage);
        this.trxs = trxfromStorage;

        return;
    }

    if (!this.trxs || this.trxs.length !== trxfromStorage.length) {
        console.log('Observed new transaction');

        Utilities.sortArrayByDate(trxfromStorage, SortDirectionEnum.desc);
        this.trxsObservable.next(trxfromStorage);
        this.trxs = trxfromStorage;
    }
  }

  async initContract(address, abstraction){    
      console.log("OTH address: " + address);
    return await abstraction.at(address);
  }

  openTransaction(hash){
      if(hash != "" && hash != "-1"){
        console.log("Transaction: " + hash);          
        window.open(this.etherscanTxUrl + hash, "_blank");
      }
  }
  
  getFullPendingTransactions(){
    this.web3Service.setDefaultBlock("pending");
    const txs = this.web3Service.getBlock("pending", (err, block) => {
        console.log('get account pending transactions');
        if (err != null) {
          console.warn('There was an error fetching your transactions.');
          return;
        }

        let transactions:Transaction[] = [];
        if (block && block.transactions) {
            console.log(block);
            block.transactions.forEach((tx) => {
                if (this.currentUser.address.toLowerCase() == tx.from.toLowerCase()
                    || this.currentUser.address.toLowerCase() == tx.to.toLowerCase()) {
                    console.log(tx);

                    let transaction = new Transaction();
                    transaction.hash = tx.hash;
                    transaction.setFormatedHash(10, 5, "...");
                    transaction.nonce = tx.nonce;
                    transaction.blockHash = tx.blockHash;
                    transaction.blockNumber = tx.blockNumber;
                    transaction.transactionIndex = tx.transactionIndex;
                    transaction.from = tx.from;
                    transaction.to = tx.to;
                    transaction.value = tx.value;

                    if (this.token.decimals == 18) {
                        transaction.formatedValue = this.web3Service.fromWei(tx.value, "ether");
                    }
                    else {
                        transaction.formatedValue = Utilities.stringifyBalance(tx.value.toNumber(), this.token.decimals);
                    }
                    transaction.gasPrice = tx.gasPrice;
                    transaction.gas = tx.gas;
                    transaction.input = tx.input;
                    transaction.status = "Pending";
                    transactions.push(transaction);
                }
            });
        }

        return transactions;
    }, true);
    
    return txs;
  }
  
  getAllTransactions(){
    let result: TransactionModel[] = [];
    let trxFromStorage = this.walletService.getItemFromStorage(this.globals.networkId);
    if(trxFromStorage){
        result = trxFromStorage.filter(trx => trx.from.toLowerCase() == this.accountAddress.toLowerCase());
    }

    return result;
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  async getDetails() {
    console.log('Get token parameters');

    try {
        console.log('Initiating the OTH instance at ' + this.tokenAddress);
        this.setStatus('Initiating transaction... (please wait)');

      const deployedOTH = this.tokenIns;// await this.OTH.at(this.token.address);
      console.log(deployedOTH);

      let _model = new TokenModel();
      _model.address = deployedOTH.address;

      _model.name = await deployedOTH.name.call({from: this.currentUser.address});
      console.log('Token name: ' + _model.name);

      _model.decimals = await deployedOTH.decimals.call({from: this.currentUser.address});
      console.log('Token decimals: ' + _model.decimals);

      _model.symbol = await deployedOTH.symbol.call({from: this.currentUser.address});
      console.log('Token symbol: ' + _model.symbol);

      return _model;

    } catch (e) {
      console.log(e);
      this.setStatus('Error getting token details; see log.');
    }
  }

  async refreshBalance() {
    const balance = await this.tokenIns.balanceOf.call(this.accountAddress, {from: this.accountAddress});
    if (this.token.decimals > 16) {
        this.balanceOth = Number(this.web3Service.fromWei(balance, "ether"));
      } else {
        this.balanceOth = Utilities.convertFromBlockchainFormat(balance, this.token.decimals);
      }

    this.web3Service.getBalance(this.accountAddress).then(b => {
        console.log("ETH Balance: " + b);
        const eth = this.web3Service.fromWei(b, "ether");
        console.log("ETH: " + eth);
        this.balanceEth = Number(eth);
      });
  }

  async refreshAccounts() {
    var i = 0;
    let accs: AccountModel[] = []; 
    while(i < this.wallet.length){
        this.accountService.getAccount(this.wallet[i].address).subscribe(async a => {
            if(a){
                await this.refreshAccountBalance(a);
                accs.push(a);
            }
        });
        i++;
    }
    this.accounts$ = of(accs);
  }

  async refreshAccountBalance(account) {
    const bal = await this.tokenIns.balanceOf.call(account.address);
    account.balance = Utilities.stringifyBalance(bal, this.token.decimals);

    this.web3Service.getBalance(account.address).then(b => {
        console.log("ETH Balance: " + b);
        const eth = this.web3Service.fromWei(b, "ether");
        console.log("ETH: " + eth);
        account.balanceEth = parseFloat(eth).toFixed(3);
      });
  }

  openDialog(): void {
    let dialogRef = this.dialog.open(WalletComponentSendDialog, {
      width: '600px',
      disableClose: true,
      data: { receiver: "", amount: 0.00, status: "pending", amountType: "eth" }
    });

    dialogRef.afterClosed().subscribe(result => {
        if(!result){
            console.log('The transaction was canceled');
            this.setStatus("The send transaction was canceled");
            return;
        }
        
        if(result && result.status == "Rejected"){
            this.setRejectedTransactionToStorage(this.accountAddress, result.receiver, result.amount)
            this.refreshTransactions();
            return;
        } 
        this.setStatus("Sending transaction");
          
        this.trxSending = true;
        if(result.amountType == "eth"){
            if(this.balanceEth >= result.amount){
                this.sendEther(result.receiver, result.amount);       
            }
            else{
                console.log("Insuficient .");
                this.setStatus("Insuficient amount.");
            }
        }else{
            if(this.balanceOth >= result.amount && this.balanceEth > 0){
            this.sendToken(result.receiver, result.amount);
            }
            else{
                console.log("Insuficient amount.");
                this.setStatus("Insuficient amount.");
            }
        }
    });
  }

  async watchTransactionStatus(){
      console.log("Watch transaction status");
    const trxRec = await this.web3Service.getTransactionReceipt(this.newTrxHash);
    if(trxRec){
        clearInterval(this.timer);
        let trx = this.walletService.getTransactionFromStorage(this.globals.networkId, this.newTrxHash);
        trx.status = trxRec.status ? "Confirmed" : "Failed";
        this.walletService.setTransactionToStorage(this.globals.networkId, trx);
        await this.refreshBalance();
        this.refreshTransactions(true);
    }
  }

  setRejectedTransactionToStorage(from, to, amount) {
    let newTrx:TransactionModel = { 
        hash: "",
        from: from,
        to: this.tokenAddress,
        tokenTransfer: {from: from, to: to, value: amount},
        date: new Date(),
        status: "Rejected",
        value: "0"
      }
      this.walletService.setTransactionToStorage(this.globals.networkId, newTrx);
  }

  openDetailsDialog(): void {
    let dialogRef = this.dialog.open(WalletComponentAccountDetailsDialog, {
      width: '360px',
      disableClose: true,
      data: { name: this.accountName, address: this.accountAddress, link: `${this.etherscanAddressUrl}` }
    });
  }

  async sendEther(_receiver, _amount){
    console.log('Sending tokens ' + _amount + ' to ' + _receiver);
    this.setStatus('Initiating transaction... (please wait)');

    let value = this.web3Service.toWei(_amount, 'ether');

    let transactionObject = {
        from: this.currentUser.address,
        to: _receiver,
        value: value,
        gas: 0
    };

    this.web3Service.estimateGas({to: transactionObject.to, value: transactionObject.value}, (err, gas) => {
        if (err != null) {
            this.trxSending = false;
            console.warn('There was an error getting estimted gas.');
            console.error(err);
            this.setStatus("There was an error getting estimted gas. See logs")
            return;
        }
        console.log("EstimateGas: " + gas);
        transactionObject.gas = gas;
        
        this.web3Service.sendTransaction(transactionObject, async (err, trxHash) => {
            if(err){
                this.trxSending = false;
                console.log(err);
                this.setStatus('Error sending ether; see log.');
                return;
            }

            if (!trxHash) {
                this.trxSending = false;
                this.setStatus('Transaction failed!'); 
                return; 
            }
        
            let newTrx:TransactionModel = { 
                hash: trxHash,
                from: this.accountAddress,
                to: _receiver,
                tokenTransfer: null,
                date: new Date(),
                status: "Submitted",
                value: _amount
            }
            await this.processTrx(newTrx);  

        }).catch((error) => {
            this.trxSending = false;
            console.log(error);
            this.setStatus('Error sending ether; see log.');
        });
    });
    
  }

  async sendToken(_receiver, _amount) {
    if (!this.OTH) {
      this.setStatus('Token is not loaded, unable to send transaction');
      return false;
    }

    console.log('Sending tokens ' + _amount + ' to ' + _receiver);
    this.setStatus('Initiating transaction... (please wait)');

    const amount = Utilities.convertToBlockchainFormat( _amount, this.token.decimals);    
    
    const trx = await this.transfer(this.accountAddress, _receiver, amount).catch ((error) => {
        console.log(error);
        this.setStatus('Error sending token; see log.');
        return null;
    });
    if (!trx) {
        this.trxSending = false;
        this.setStatus('Transaction failed!');  
    } else {
        let newTrx:TransactionModel = { 
            hash: trx,
            from: this.accountAddress,
            to: this.tokenAddress,
            tokenTransfer: {from: this.accountAddress, to: _receiver, value: _amount},
            date: new Date(),
            status: "Submitted",
            value: "0"
        }
        await this.processTrx(newTrx);  
    }  
  }

  async processTrx(trx){
   
    this.newTrxHash = trx.hash;

    this.walletService.setTransactionToStorage(this.globals.networkId, trx);

    this.setStatus('Transaction submited! Wait the block');
    console.log("Wait mine the block");
    const rec = await this.web3Service.waitBlock(this.newTrxHash);
    this.trxSending = false;
    
    let trxStorage = this.walletService.getTransactionFromStorage(this.globals.networkId, this.newTrxHash);
    trxStorage.status = rec.status ? "Confirmed" : "Failed";
    if(!rec.status){
        this.setStatus("Transaction mined but execution failed");
    }
    else this.setStatus('Transaction confirmed!');   

    this.walletService.setTransactionToStorage(this.globals.networkId, trxStorage);
    await this.refreshBalance();
    this.refreshTransactions(true);    
  }

  async transfer(from, to, amount) {
    const deployedToken = await this.OTH.at(this.token.address);
    const estimateGas = await deployedToken.transfer.estimateGas(to, amount, {from: from});
        console.log("Estimate gas: " + estimateGas);
    return await deployedToken.transfer.sendTransaction(to, amount, {from: from, gas: estimateGas});
  }

  create() {
    console.log("Create new account.");
    //5e2fe80c2b9bbb37689422e3f904a876dddf4d7258a1dd7a2efbd3dba3e25b7f 
    let newAcc = this.web3Service.privateKeyToAccount("0x5e2fe80c2b9bbb37689422e3f904a876dddf4d7258a1dd7a2efbd3dba3e25b7f");
    console.log(newAcc);
    //this.web3Service.addAccountToWallet(newAcc);
    //this.web3Service.saveWallet('test#!$');
    //this.accountService.addAccount(newAcc.address, "Acount_1", "Account_1", newAcc.privateKey);
  }

  getTrans(){
      const list = this.walletService.getItemFromStorage(this.globals.networkId);
      console.log("Trxs count: " + list.length);
  }

  saveBatch(){
      this.walletService.setItemToStorage(this.globals.networkId, TRANSACTIONS);
      this.refreshTransactions();
  }

  async getTransactionReceipt(hash){
    return await this.web3Service.getTransactionReceipt(hash);
    
  }
}

@Component({
    selector: 'app-wallet-send-dialog',
    templateUrl: 'wallet.component.send.dialog.html',
    styles:[`  
    .address-field {
      width: 400px;
    }
  `]
})
export class WalletComponentSendDialog  implements OnInit {
    firstFormGroup: FormGroup;
    
    constructor(
      public web3Service: Web3Service,
      private _formBuilder: FormBuilder,
      public dialogRef: MatDialogRef<WalletComponentSendDialog>,
      @Inject(MAT_DIALOG_DATA) public data: any) {
        console.log(web3Service);
       }
  
    ngOnInit(){
        this.firstFormGroup = this._formBuilder.group({
            recipientCtrl: [this.data.receiver, Validators.required, this.addressValidator(this.web3Service)],
            amountCtrl: [this.data.amount, Validators.required, this.amountValidator],
            amountType: 'oth'
        });
          
    }

    amountValidator(c: AbstractControl){
        return Number(c.value) > 0 ? of(null) : of({
            validateAmount: {
                valid: false
            }
        });
    }

    addressValidator(web3Service: Web3Service) {
        return (control: AbstractControl): {[key: string]: any} | null => {
          const validAddress = web3Service.isAddress(control.value);
          if(validAddress) return of(null)
          else
            return of({'address': {value: control.value}});
        };
      }

    //get recipientCtrl(): any { return this.firstFormGroup.get('recipientCtrl'); }
    //get amountCtrl(): any { return this.firstFormGroup.get('amountCtrl'); }

    onConfirmClick(): void {
        this.data.status = "Submitted";
        this.data.amountType = this.firstFormGroup.value.amountType;
    }

    onRejectClick(): void {
      this.data.status = "Rejected";
      this.dialogRef.close();
    }
  
}

@Component({
    selector: 'app-wallet-account-details-dialog',
    templateUrl: 'wallet.component.accountdetails.dialog.html',
    styleUrls: ['./wallet.component.css']
})
export class WalletComponentAccountDetailsDialog  implements OnInit {
    firstFormGroup: FormGroup;
    
    constructor(
      private _formBuilder: FormBuilder,
      public dialogRef: MatDialogRef<WalletComponentSendDialog>,
      @Inject(MAT_DIALOG_DATA) public data: any) {
        
       }
  
    ngOnInit(){
        this.firstFormGroup = this._formBuilder.group({
            passwordCtrl: ['', Validators.required]
        });
          
    }

    onNoClick(): void {
      this.dialogRef.close();
    }

    selectAll(e): void {
        e.target.select();
    }
}