import { Injectable } from '@angular/core';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators';
import { Attendee, Speaker } from './account/account.service';
import { Globals } from './globals';

export class ConferenceEntity{    
    address: string = "";
    title: string = "";
    descriptions:string = "";
    organizer: string = "";
    image: string = "";
    created: Date = new Date();
    createdBy: string = "";
    netId: number;
}

export class ConferenceModel extends ConferenceEntity {
    //address: string;
    //title: string;
    //descriptions:string;
    //image: string;
    //organizer: string;
    owner: any;
    token: string;
    sDate: Date = new Date();
    eDate: Date = new Date();
    numVotTokens: number;
    numAttendees: number;
    maxAttendees: number;
    speakerList: Speaker[] = [];
    attendeeList: Attendee[] = [];
    voucherDiscountDecimals: number;
    voucherCount = 0;
    voucherList: Voucher[] = [];
    attendeeFreeSlots: number;
    balance: number;
    balanceEth: number
}

export class ItemModel{
    text: string;
    value: string;
    selected: boolean = false

    constructor(text, value, selected?){
        this.text = text;
        this.value = value;
        this.selected = selected;
    }
}

export class Voucher {
    constructor(public id: number, 
        public title: string, 
        public discount: number, 
        public price: number, 
        public active: boolean)
    {}

    toString(){
        return this.title + " (discount: " + this.discount + "%; price: " + this.price + " OTHs)"; 
    }

    isActive(){
        return this.active ? "Yes" : "No";
    }
}

// export class Attendee {
//     voucher: Voucher;
//     hasVoucher: boolean;
//     availableVotingTokens: number;
//     consumedVotingTokens: number;
//     voteCount: number;
//     rewardedTokens: number;
// }

// export const VOUCHERS: Voucher[] = [
//     {
//         id: 1,
//         title: "0.5% discount voucher",
//         discount: 0.5,
//         price: 20,
//         active: true
//     },
//     {
//         id: 2,
//         title: "10% discount voucher",
//         discount: 10,
//         price: 30,
//         active: true
//     },
//     {
//         id:3,
//         title: "20% discount voucher",
//         discount: 20,
//         price: 40,
//         active: true
//     },
//     {
//         id:4,
//         title: "5% discount voucher",
//         discount: 5,
//         price: 25,
//         active: false
//     }

// ]

export const CONFERENCES: ConferenceEntity[] = [
    {
        address: "0xE744783cFF6e26284746bbCB2f37694634365D92",
        title: "MICROSOFT EVENT",
        descriptions: "Microsoft 2018 conference",
        organizer: "Tekwill",
        image: "/assets/images/events/B3587564-5638-44F0-B2D0-C97C85AD523B.jpg",
        created: new Date("Jul 12 2018 17:37:14 GMT+03:00"),
        createdBy: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
        netId: 5777
     },
    {
        address: "0x3a8d11b5284b351767c3c7ed9efc4bf86d5d4f76",
        title: "CODECAMP 2018 EVENT",
        descriptions: "CodeCamp 2018 conference",
        organizer: "Tekwill",
        image: "/assets/images/events/B3587564-5638-44F0-B2D0-C97C85AD523B.jpg",
        created: new Date("Jul 11 2018 14:29:14 GMT+03:00"),
        createdBy: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
        netId: 5777
    }//,
    // {
    //     address: "0x793256fe9c0f31bf5945f1589861a58b70c89bc1",
    //     title: "qqq",
    //     descriptions: "qqqq",
    //     organizer: "qqqqq",
    //     image: "/assets/images/events/B3587564-5638-44F0-B2D0-C97C85AD523B.jpg",
    //     created: new Date("Jul 11 2018 15:54:14 GMT+03:00"),
    //     createdBy: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
    //     netId: 5777
    // }
    // {
    //     address: "0xf065b9c7f7c288e092c6665ce3f664096343bc96",
    //     title: "Event 2",
    //     descriptions: "Event 2 Description",
    //     organizer: "Org2",
    //     image: "/assets/images/events/B3587564-5638-44F0-B2D0-C97C85AD523B.jpg",
    //     created: new Date(2018, 6, 10),
    //     createdBy: "0xf776e9be02f42ba3a436f9427853a4bfe4337778"
    // },
    // {
    //     address: "0xf065b9c7f7c288e092c6665ce3f664096343bc96",
    //     title: "Event 3",
    //     descriptions: "Event 3 Description",
    //     organizer: "Org3",
    //     image: "/assets/images/events/B3587564-5638-44F0-B2D0-C97C85AD523B.jpg",
    //     created: new Date(2018, 6, 11),
    //     createdBy: "0x2205c02320d9ee8cf79afa6dca823b2c46399884"
    // }
];

@Injectable()
export class ConferenceService {

  constructor(private globals: Globals){}

  getAllConferences() { 
      return of(CONFERENCES); 
    }

  getConferences() { 
    return this.getAllConferences().pipe(
        map(list => list.filter(c => c.netId == this.globals.networkId))
    );
  }

  getConferencesByOwner(owner: string) {
    return this.getConferences().pipe(
      map(c => c.filter(f => f.createdBy.toLowerCase() === owner.toLowerCase()))
    );
  }

  getConference(address: string) {
    return this.getConferences().pipe(
      map(confs => confs.find(conf => conf.address === address))
    );
  }

  add(address, title, descriptions, organizer, imagePath, created, createdBy){
    const entity = new ConferenceEntity();
    entity.address = address;
    entity.title = title;
    entity.descriptions = descriptions;
    entity.organizer = organizer;
    entity.image = imagePath;
    entity.created = created;
    entity.createdBy = createdBy;
    entity.netId = this.globals.networkId;

    const ce = CONFERENCES.find(c => c.address.toLowerCase() === entity.address.toLowerCase());

    if(!ce){
        CONFERENCES.push(entity);
    }
  }

  async initConference(address, confAbstraction){    
    return await confAbstraction.at(address);
  }

  async getVoucherDetails(id, from, conference) {
    //const conf = conference//await this.Conference.at(this.model.address);
    return await conference.vouchers.call(id, {from: from});
  }
}


// const CONFERENCES: ConferenceModel[] = [
//     {
//         address: "0xf065b9c7f7c288e092c6665ce3f664096343bc96",
//         organizer: "0x2205c02320d9ee8cf79afa6dca823b2c46399884",
//         token: "0x05bf482b5f997f7d6c995ed461fa1701b28ad43d",
//         sDate: (new Date(2018, 6, 10)).toDateString(),
//         eDate: (new Date(2018, 6, 11)).toDateString(),
//         numVotTokens: 100,
//         numAttendees: 2,
//         maxAttendees: 100,
//         speakers: [            
//            "0x8100753b07a5c0704d1c974f6d8e924eb55de952",
//            "0x7af5a826ba33a4ee5692950e94e1861f048ee380"
//         ],
//         attendees: [
//             "0xf776e9be02f42ba3a436f9427853a4bfe4337778",
//             "0xfd31a07e9d2722ef16e0d6a3d4072c96780e318a"
//         ],
//         ticketPrice: 10,
//         attendeeFreeSlots: 99,
//         speaker: "0x7af5a826ba33a4ee5692950e94e1861f048ee380",
//         balance: 20
//     }
// ];