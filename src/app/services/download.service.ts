import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import { Subscriber } from "rxjs/Subscriber";
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { openSqliteDb } from "../app.utils";

@Injectable()
export class DownloadService {

    constructor(
        // add cordova fiie plugin here
        private sqlite: SQLite
    ) { }

    getDownloadedVideosOf(userId: string, id: string) {

    }

    addVideoFor(userId: string, id: string) {
        // TODO: save entry to local database first
        // TODO: start download of the video
        // TODO: return an observable so the download progress can be observed 

        return Observable.create((observer: Subscriber<number>) => {
            // update progress using next 
            let progress = 0;
            let handle = setInterval(() => {
                if (progress >= 100) {
                    clearInterval(handle);
                    observer.complete();
                } else {
                    progress++;
                    observer.next(progress);
                }
            }, 125);

            return () => {
                // cleaup logic
            }
        })
    }

    removeVideoFor(userId: string, id: string) {
    }

    removeAllVideosFor(userId: string) {
    }

    removeAllExpiredVideosFor(userId: string) {
    }

    private preparePlaylistTable() {
        return openSqliteDb(this.sqlite).then(db => {
            return this.createDownloadsTable(db);
        })
    }

    private createDownloadsTable(db: SQLiteObject) {
        return new Promise<SQLiteObject>((resolve, reject) => {
            try {
                db.executeSql(`CREATE TABLE IF NOT EXISTS downloads(
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        bcid CHAR(13) NOT NULL,
                        memid CHAR(36) NOT NULL,
                        exp_date TEXT NOT NULL)`, {})
                    .then(() => { resolve(db); })
                    .catch(e => { reject(e); })
            } catch (e) {
                reject(e);
            }
        });
    }
}