import {TestBed, inject} from '@angular/core/testing';
import Web3 from 'web3';

import {Web3Service} from './web3.service';

import metacoin_artifacts from '../../../build/contracts/MetaCoin.json';
import oth_artifacts from '../../../build/contracts/OTH.json';
import conference_artifacts from '../../../build/contracts/Conference.json';


declare let window: any;

describe('Web3Service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Web3Service]
    });
  });

  it('should be created', inject([Web3Service], (service: Web3Service) => {
    expect(service).toBeTruthy();
  }));

  it('should inject a default web3 on a contract', inject([Web3Service], (service: Web3Service) => {
    service.bootstrapWeb3();

    service.artifactsToContract(conference_artifacts).then((abstraction) => {
        expect(abstraction.currentProvider.host).toBe('http://localhost:7545');
      });

    return service.artifactsToContract(oth_artifacts).then((abstraction) => {
      expect(abstraction.currentProvider.host).toBe('http://localhost:7545');
    });
  }));

  it('should inject a the window web3 on a contract', inject([Web3Service], (service: Web3Service) => {
    window.web3 = {
      currentProvider: new Web3.providers.HttpProvider('http://localhost:1337')
    };

    service.bootstrapWeb3();

    service.artifactsToContract(conference_artifacts).then((abstraction) => {
        expect(abstraction.currentProvider.host).toBe('http://localhost:1337');
    });

    return service.artifactsToContract(oth_artifacts).then((abstraction) => {
      expect(abstraction.currentProvider.host).toBe('http://localhost:1337');
    });
  }));
});
