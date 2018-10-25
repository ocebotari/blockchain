import {Injectable} from '@angular/core';
import * as contract from 'truffle-contract';
import {Subject} from 'rxjs/Rx';
import { Globals } from '../globals';
declare let require: any;
const Web3 = require('web3');


declare let window: any;

@Injectable()
export class Web3Service {
  private web3: any;
  private accounts: string[];
  public ready = false;
  public MetaCoin: any;
  public accountsObservable = new Subject<string[]>();
  public wallet: any;

  constructor(private globals: Globals) {
    window.addEventListener('load', (event) => {
      this.bootstrapWeb3();
    });
  }

  public bootstrapWeb3() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof window.web3 !== 'undefined') {
      // Use Mist/MetaMask's provider
      this.web3 = new Web3(window.web3.currentProvider);
      console.log(window.web3.currentProvider);
    } else {
      console.log('No web3? You should consider trying MetaMask!');

      // Hack to provide backwards compatibility for Truffle, which uses web3js 0.20.x
      Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      //this.web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/b9rcF5nUpAdjm4Zyc3jb'));
      this.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
    }
    
    this.getNetId().then(id => {
        this.globals.networkId = id;
        console.log("Net ID is: " + this.globals.networkId);
        if(id == 4){
            const acc = this.privateKeyToAccount("0x5e2fe80c2b9bbb37689422e3f904a876dddf4d7258a1dd7a2efbd3dba3e25b7f");
            console.log(acc);
        }
    });
    
    setInterval(() => this.refreshAccounts(), 1000);
  }

  private refreshAccounts() {
    this.web3.eth.getAccounts((err, accs) => {
      console.log('Refreshing accounts');
      if (err != null) {
        console.warn('There was an error fetching your accounts.');
        return;
      }

      // Get the initial account balance so it can be displayed.
      if (accs.length === 0) {
        console.warn('Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.');
        return;
      }

      if (!this.accounts || this.accounts.length !== accs.length || this.accounts[0] !== accs[0]) {
        console.log('Observed new accounts');

        this.accountsObservable.next(accs);
        this.accounts = accs;
      }

      this.ready = true;
    });
  }

  /**
   * createContract artifacts   */
  public createContract(abi, address, from) {
    const c = new this.web3.eth.Contract(abi, address);

    var trx = c.methods.changeVoucherState(2, true);
    console.log(trx);
    trx.estimateGas({from: from},(err, gasAmount) => {
        if(err != null){
            console.log("Error estimate gas transaction");
            console.error(err);
        }
        console.log("Estimate gas: " + gasAmount);                
    });
    trx.send({from: from})
        .on('receipt', function(receipt){
            console.log(receipt);
        })
    //trx.send({from:this.currentUser.address}).then(console.log);

      return c;
  }

  public async artifactsToContract(artifacts) {
    if (!this.web3) {
      const delay = new Promise(resolve => setTimeout(resolve, 100));
      await delay;
      return await this.artifactsToContract(artifacts);
    }
    const contractAbstraction = contract(artifacts);
    
    contractAbstraction.setProvider(this.web3.currentProvider);

    return contractAbstraction;
  }

  public encodeFunctionSignature (functionName){
    return this.web3.eth.abi.encodeFunctionSignature(functionName);
  }

  public encodeParameter (type, parameter){
    return this.web3.eth.abi.encodeParameter(type, parameter);
  }

  public encodeFunctionCall (sonInterface, parameters){
    return this.web3.eth.abi.encodeFunctionCall(sonInterface, parameters);
  }

  public getNetId(){
      return this.web3.eth.net.getId();
  }

  public getAccounts(){
    console.log("Getting accounts.");
    return this.accounts;
  }

  public getDefaultAccount(){
    return this.web3.eth.defaultAccount;
  }

  public setDefaultAccount(address){
    this.web3.eth.defaultAccount = address;
  }

  public createAccount(entropy?){
    return this.web3.eth.accounts.create(entropy);
  }

  public privateKeyToAccount(privateKey) {
      return this.web3.eth.accounts.privateKeyToAccount(privateKey);
  }

  public getBlockNumber(callback){
      return this.web3.eth.getBlockNumber(callback);
  }

  public getBalance(address, callback?){
    return this.web3.eth.getBalance(address, callback);
  }
   
  public saveWallet(password): boolean{
    return this.web3.eth.accounts.wallet.save(password);
  } 

  public loadWallet(password){
    return this.web3.eth.accounts.wallet.load(password);
  }

  public getWallet() {
      return this.web3.eth.accounts.wallet;
  }

  public addAccountToWallet(account) {
    return this.web3.eth.accounts.wallet.add(account);
  }

  public getBlock(blockHashOrBlockNumber, callback, returnTransactionObjects = false, ){
    return this.web3.eth.getBlock(blockHashOrBlockNumber, returnTransactionObjects, callback)
  }

  public setDefaultBlock(value: string){
      this.web3.eth.defaultBlock = value;
  }

  public getTransactionReceipt(hash) {
      return this.web3.eth.getTransactionReceipt(hash);
  }

  public getTransaction(hash, callback) {
    return this.web3.eth.getTransaction(hash, callback);
 }

 public sendTransaction(transactionObject, callback){        
    return this.web3.eth.sendTransaction(transactionObject, callback);    
 }

  //Converts a number of wei into the following ethereum units
  public fromWei(number, unit = "ether"){
    const bn = this.web3.utils.toBN(number);
    return this.web3.utils.fromWei(bn, unit);
  }

  //Converts an ethereum unit into wei.
  public toWei(number, unit = "ether"){
    return this.web3.utils.toWei(number, unit);
  }

  //Converts a HEX string into a ASCII string.
  //Params: String - A HEX string to be converted to ascii.
  //Returns : String - An ASCII string made from the given hexString.
  public toAscii(hexString){
      return this.web3.utils.hexToAscii(hexString);
  }

  //Returns a byte array from the given HEX string.
  public hexToBytes(hexString){
    return this.web3.utils.hexToBytes(hexString);
  }

  //Executes a message call or transaction, which is directly executed in the VM of the node, but never 
  //mined into the blockchain and returns the amount of the gas used.
  public estimateGas(callObject, callback?){
      return this.web3.eth.estimateGas(callObject, callback);
  }

  //Checks if the given string is an address.
  //Params: String - A HEX string.
  //Returns - false if it's not on a valid address format. 
  //Returns true if it's an all lowercase or all uppercase valid address. 
  public isAddress(hexString):boolean{
      return this.web3.utils.isAddress(hexString);
  }

  public hexToUtf8(hex) {
      return this.web3.utils.hexToUtf8(hex);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitBlock(transactionHash) {
    while (true) {
        
        const bn = await this.web3.eth.getBlockNumber();

        const receipt = await this.getTransactionReceipt(transactionHash);
        if(receipt){
            if(receipt.contractAddress){
                console.log("Your contract has been deployed at address");
                console.log(receipt.contractAddress);                
            }

            console.log("Receipt transaction is");
            console.log(receipt);

            console.log("A mined block " + bn + " included your transaction.");
            console.log("Note that it might take 30 - 90 sceonds for the block to propagate befor it's visible");

            if(!receipt.status){
                console.log("Transaction mined but execution failed");
            }

            return receipt;

        }
        
        console.log("Waiting a mined block to include your transaction... currently in block " + bn);
        await this.sleep(4000);
    }
  }
}
