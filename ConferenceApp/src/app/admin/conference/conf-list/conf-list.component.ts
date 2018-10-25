import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../../util/web3.service';
import { MatSnackBar } from '@angular/material';
import { Observable, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { MatTableDataSource } from '@angular/material';

import { AccountModel, AccountService } from '../../../account/account.service';
import { ConferenceModel, ConferenceService, ConferenceEntity, CONFERENCES } from '../../../conference.service';
import { map } from 'rxjs/operator/map';
import { merge } from 'rxjs/operator/merge';

declare let require: any;
const conf_artifacts = require('../../../../../build/contracts/Conference.json');

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

        this.currentUser = this.accountService.getCurrentUser();

        this.resourcesLoaded = false;
        this.confs$ = this.route.paramMap.pipe(
            switchMap((params: ParamMap) => {                       
                return this.confService.getConferencesByOwner(this.currentUser.address);
            })
        );

        this.web3Service.artifactsToContract(conf_artifacts).then((confAbstraction) => {
            this.Conference = confAbstraction;
            this.confs$.subscribe(async confs => {
                let result = await this.getConfs(confs);
                this.list.next(result);
                this.resourcesLoaded = true;

            });
        });
    }
  
  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }
  
  async getConfs(confs) {
    console.log('Get conference parameters');
    try {
      let models: ConferenceModel[] = [];
      for(var i = 0; i < confs.length; i++){
        const item = confs[i];
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

        const _entity = await conf.getConferenceDetails({from: this.currentUser.address});

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
