import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { USER_DATA_KEY } from "../../app/app.constants";
import { Storage } from '@ionic/storage';

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
})
export class ProfilePage {

  username: string = ' ';
  email: string = ' ';
  points: string = '0';
  ir_id:string = ' ';
  expire: string = ' ';
  avatar: string = ' ';
  days_left: string=' ';
  membership: string ='';

  constructor(public navCtrl: NavController, public navParams: NavParams,
  private storage: Storage) {
    
  }



  ionViewDidEnter() {
     this.storage.get(USER_DATA_KEY).then(userDetails =>{
          this.username=userDetails.first_name;
          this.email=userDetails.email;
          this.points=userDetails.points;
          this.avatar= 'http://the-v.net/Widgets_Site/avatar.ashx?id='+userDetails.id;
          this.membership=userDetails.membership;
          this.expire= userDetails.membership_end;
          this.ir_id = userDetails.irid;
          this.days_left= Math.floor((Date.parse(userDetails.membership_end) - Date.now())/1000/60/(60*24)).toString();
        })
  }

}
