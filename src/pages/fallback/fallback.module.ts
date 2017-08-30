import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FallbackPage } from './fallback';

@NgModule({
  declarations: [
    FallbackPage,
  ],
  imports: [
    IonicPageModule.forChild(FallbackPage),
  ],
})
export class FallbackPageModule {}
