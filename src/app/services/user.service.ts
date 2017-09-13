import { Injectable } from "@angular/core";
import { Http, Headers } from "@angular/http";
import { encodeObject } from "../app.utils";
import { UserDetail } from "../models/user.models";
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/toPromise'

@Injectable()
export class UserService {
    private static API_URL = 'http://cums.the-v.net/site.aspx'

    constructor(
        private http: Http
    ) { }

    getUserDetails(id: string) {
        let headers = new Headers()
        headers.set('Content-Type', 'application/x-www-form-urlencoded')

        return this.http.post(UserService.API_URL, encodeObject({
            'action': 'DDrupal_User_GetLoggedInUserData',
            'id': id
        }), { headers: headers }).map(response => {
            let userDetails = <UserDetail[]>response.json();
            if (userDetails.length > 0) {
                return userDetails[0];
            } else {
                return null;
            }
        }).toPromise();
    }
}