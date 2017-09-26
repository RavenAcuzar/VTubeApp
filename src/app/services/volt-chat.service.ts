import { Injectable } from "@angular/core";
import { Http, Headers } from "@angular/http";
import { Storage } from '@ionic/storage';
import { USER_DATA_KEY } from "../app.constants";
import { encodeObject } from "../app.utils";

@Injectable()
export class VoltChatService {

    constructor(
        private http: Http,
        private storage: Storage
    ) { }

    sendMessage(message: String, beforeCallback: (id, username: string) => void): Promise<string> {
        return this.storage.get(USER_DATA_KEY).then(ud => {
            beforeCallback(ud.id, ud.first_name);

            let headers = new Headers();
            headers.set('Content-Type', 'application/x-www-form-urlencoded');

            return this.http.post('http://192.168.130.166:8080', encodeObject({ message: message }), { headers: headers })
                .map(r => r.json().message).toPromise();
        });
    }
}