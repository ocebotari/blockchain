import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { MatSnackBar } from '@angular/material';
import { Observable, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { AccountModel, AccountService } from '../../account/account.service';
import { ConferenceModel, ConferenceService, ConferenceEntity } from '../../conference.service';

declare let require: any;
const conf_artifacts = require('../../../../build/contracts/Conference.json');

@Component({
  selector: 'app-conf-list',
  templateUrl: './conf-list.component.html',
  styleUrls: ['./conf-list.component.css']
})
export class ConfListComponent implements OnInit {
  Conference: any;
  confs$: Observable<ConferenceEntity[]>;
  list = new Subject<ConferenceModel[]>();
  currentUser: AccountModel;
  isEmpty: boolean = false;
  resourcesLoaded = true;

  displayedColumns = ['title', 'sdate', 'edate', 'owner', 'token'];

  constructor(private web3Service: Web3Service, 
    private accountService: AccountService, 
    private confService: ConferenceService, 
    private matSnackBar: MatSnackBar,
    private route: ActivatedRoute) {
    console.log('Constructor: ' + web3Service);
    console.log('Constructor: ' + confService);
  }

    ngOnInit(): void {
        console.log('OnInit: ' + this.web3Service);
        console.log(this);     
        this.resourcesLoaded = false;           

        this.accountService.getDefaultAccount().subscribe(acc => {
            this.currentUser = acc;
        });
        
        this.confs$ = this.route.paramMap.pipe(
            switchMap((params: ParamMap) => {                       
                return this.confService.getConferences();
            })
        );

        this.web3Service.artifactsToContract(conf_artifacts).then((confAbstraction) => {
            this.Conference = confAbstraction;  
            this.confs$.subscribe(async confs => {
                const delay = new Promise(resolve => setTimeout(resolve, 1000));
                await delay;
                let result = await this.getConfs(confs);
                this.resourcesLoaded = true;
                this.list.next(result);
                this.isEmpty = !result || result.length == 0;
            });          
        });
    }
  
  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }
  
  async getConfs(confs) {
    console.log('Get conference parameters');
    console.log(confs);
    try {
      let models: ConferenceModel[] = [];
      for(var i = 0; i < confs.length; i++){
        const item = confs[i];
        // const conf = await this.Conference.at(item.address, {from: this.currentUser.address}).catch(err => {
        //     console.error(err);
        //     return null;
        // });

        const conf = await this.Conference.at(item.address, {from: this.currentUser.address}).then(instance => {
            console.log(instance);
            return instance;
        }).catch(function(err) {
            console.log(err);
            return null;
        });

        if(!conf) continue;
        console.log(conf);
        
        let model = new ConferenceModel();
        model.address = item.address;
        model.title = item.title;
        model.descriptions = item.descriptions;
        model.image = item.image && item.image.length > 0 ? item.image : "/assets/images/events/B3587564-5638-44F0-B2D0-C97C85AD523B.jpg";
        model.organizer = item.organizer;

        const _entity = await conf.getConferenceDetails();

        let sdate = _entity[0];
        let time = Number(sdate);
        model.sDate = new Date(time * 1000);
        console.log('Start date: ' + model.sDate);

        const edate = _entity[1];
        time = Number(edate);
        model.eDate = new Date(time * 1000);
        console.log('End date: ' + model.eDate);

        const owner = _entity[2];
        console.log('Owner is: ' + owner);
        this.accountService.getAccount(owner)
            .subscribe(acc => {
                model.owner = new AccountModel(acc.address, acc.publicKey, acc.privateKey, acc.firstName, acc.lastName)
            });

        model.token = _entity[6];
        console.log('Token address: ' + model.token);

        models.push(model);
      }   

      return models;
      
    } catch (e) {
      console.log(e);
      this.setStatus('Error getting conferences; see log.');
    }
  }

}
