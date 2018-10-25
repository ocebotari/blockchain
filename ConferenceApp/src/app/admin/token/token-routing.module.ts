import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../auth-guard.service';

import { TokenDetailsComponent } from './oth-details/oth-details.component';
import { TokenSenderComponent } from './token-sender/token-sender.component';
import { TokenListComponent } from './token-list/token-list.component';
import { TokenMintComponent } from './token-mint/token-mint.component';
import { TokenCreateComponent } from './token-create.component';

const tokenRoutes: Routes = [
//   { 
//     path: '', 
//     component: TokenListComponent,
//     canActivate: [AuthGuard],
//     children: [
//       {
//         path: '',
//         canActivateChild: [AuthGuard],
//         children: [
//                 {
//                 path: ':id',
//                 component: TokenDetailsComponent
//                 },
//                 {
//                 path: ':id/send',
//                 component: TokenSenderComponent
//                 },
//                 { path: '', component: TokenListComponent }
//             ]
//       }]
//      },
  { path: 'token/create',  component: TokenCreateComponent },
  { path: ':id',  component: TokenDetailsComponent },
  { path: ':id/mint', component: TokenMintComponent },
  { path: ':id/send', component: TokenSenderComponent },
  { path: '', component: TokenListComponent, canActivate: [AuthGuard], }

  //{ path: 'conferences', canActivate: [AuthGuard], component: ConfListComponent },
  //{ path: 'conferences/:id', canActivate: [AuthGuard], component: ConfDetailsComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(tokenRoutes)
  ],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class TokenRoutingModule { }
