import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { USER_DATA_KEY } from "../../app/app.constants";
import { Storage } from '@ionic/storage';
import { Http, RequestOptions, Headers, URLSearchParams } from "@angular/http";
import { formatDate } from "../../app/app.utils";

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
})
export class ProfilePage {

  userDetails = {};
  days_left = '';
  url = 'http://site.the-v.net/';

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private storage: Storage, private http: Http, private alertCtrl: AlertController) {
  }



  ionViewDidEnter() {
    this.getProfileDetails();
  }

  getProfileDetails() {
    this.storage.get(USER_DATA_KEY).then(userDetails => {

      let body = new URLSearchParams();
      body.set('action', 'DDrupal_User_GetLoggedInUserData');
      body.set('userid', userDetails.id);

      let options = new RequestOptions({
        headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      });

      this.http.post('http://cums.the-v.net/site.aspx', body, options)
        .subscribe(response => {
          let data = response.json().map(c => {
            c.finalAvatarUrl = this.url + c.imageUser;
            c.fullname = c.first_name + " " + c.last_name;
            c.userBday = formatDate(new Date(c.birthday));
            return c
          })
          if (data.length > 0) {
            this.userDetails = data[0];
          } else {
            let alert = this.alertCtrl.create({
              title: 'Error!',
              message: 'Profile not found!',
              buttons: [{
                text: 'Ok',
                handler: () => {
                  console.log('Cancel clicked');
                  alert.dismiss();
                  return false;
                }
              }
              ]
            })
          }
        }, e => {
          console.log(e);
        }, () => {
        });

      this.days_left = Math.floor((Date.parse(userDetails.membership_end) - Date.now()) / 1000 / 60 / (60 * 24)).toString();
    })
  }

}
