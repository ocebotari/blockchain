import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard }                from './auth-guard.service';
import { SelectivePreloadingStrategy } from './selective-preloading-strategy';
import { AdminModule } from './admin/admin.module';

const appRoutes: Routes = [
    {
      path: 'admin',
      loadChildren: './admin/admin.module#AdminModule',
      canLoad: [AuthGuard]
    },
    { 
      path: '', 
      redirectTo: '/conferences', 
      pathMatch: 'full',
      data:{preload: true},
      canLoad: [AuthGuard]
    },
  ];

@NgModule({
    imports: [
        RouterModule.forRoot(
          appRoutes,
          {
            enableTracing: true, // <-- debugging purposes only
            preloadingStrategy: SelectivePreloadingStrategy,
    
          }
        )
      ],
    exports: [ RouterModule ],
    providers: [
        SelectivePreloadingStrategy
      ]
})
export class AppRoutingModule { }
