import { Component } from '@angular/core';
import { AuthService }      from './auth.service';
import { Web3Service } from './util/web3.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Decentralized Apps';

  constructor(public authService: AuthService) {
  }
}
