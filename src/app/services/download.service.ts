import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import { Subscriber } from "rxjs/Subscriber";
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { openSqliteDb } from "../app.utils";
import { DownloadEntry } from "../models/download.models";
import { File } from '@ionic-native/file';
import { FileTransfer, FileTransferObject } from "@ionic-native/file-transfer";
import { Platform } from "ionic-angular";

@Injectable()
export class DownloadService {
    private fileTransferObject: FileTransferObject;

    constructor(
        fileTransfer: FileTransfer,
        private platform: Platform,
        private sqlite: SQLite,
        private file: File
    ) {
        this.fileTransferObject = fileTransfer.create();
    }

    getDownloadedVideosOf(userId: string) {
        return this.preparePlaylistTable().then(db => {
            return db.executeSql('SELECT * FROM downloads WHERE memid = ?', [userId])
        }).then(a => {
            return new Promise<DownloadEntry[]>((resolve, reject) => {
                try {
                    let downloadEntries: DownloadEntry[] = []
                    for (let i = 0; i < a.rows.length; i++) {
                        let rawDownloadEntry = a.rows.item(i);

                        let downloadEntry: DownloadEntry = {
                            id: rawDownloadEntry.id,
                            bcid: rawDownloadEntry.bcid,
                            memid: rawDownloadEntry.memid,
                            dl_date: new Date(rawDownloadEntry.dl_date)
                        }
                        downloadEntries.push(downloadEntry);
                    }
                    resolve(downloadEntries)
                } catch (e) {
                    reject(e)
                }
            })
        })
    }

    addVideoFor(userId: string, bcid: string) {
        return new Promise<Observable<number>>((resolve, reject) => {
            let rootPath = '';
            if (this.platform.is('ios')) {
                rootPath = `${this.file.dataDirectory}/vtube`;
            } else if (this.platform.is('android')) {
                rootPath = `${this.file.externalDataDirectory}/vtube`;
            } else {
                reject({ error: 'Platform not supported.' })
                return;
            }

            this.preparePlaylistTable().then(db => {
                // 1) save entry to local database
                return db.executeSql('INSERT INTO downloads(bcid, memid, dl_date) VALUES(?, ?, ?)', [
                    bcid, userId, new Date().toLocaleDateString()
                ])
            }).then(a => {
                if (a.rowsAffected === 1) {
                    // TODO: 2) start download of the video and return an observable so 
                    // the download progress can be observed 

                    let url = '';
                    let path = `${rootPath}/${bcid}.mp4`;
                    // let url = `http://cums.the-v.net/vid.aspx?id=${$location.search()["id"]}&irid=${window.localStorage.getItem("email")}`;
                    resolve(new Observable((observer: Subscriber<number>) => {
                        this.fileTransferObject.onProgress(e => {
                            let progress = (e.lengthComputable) ?  Math.floor(e.loaded / e.total * 100) : -1;
                            observer.next(progress);
                        });
                        this.fileTransferObject.download(url, path, true).then(entry => {
                            observer.complete();
                        });

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
                    }));
                } else {
                    reject({ error: 'Download entry was not successfully inserted.' })
                }
            });
        })
    }

    removeVideoFor(userId: string, bcid: string) {
        return this.preparePlaylistTable().then(db => {
            return db.executeSql('DELETE FROM downloads WHERE memid = ? and bcid = ?', [userId, bcid])
        }).then(a => {
            return new Promise<boolean>((resolve, reject) => {
                if (a.rowsAffected === 1)
                    resolve(true)
                else if (a.rowsAffected === 0)
                    reject(false)
                else
                    reject({ error: 'Multiple values were deleted!' })
            })
        })
    }

    removeAllVideosFor(userId: string) {
        return this.getDownloadedVideosOf(userId).then(downloadEntries => {
            let playlistBcids = downloadEntries.map(d => d.bcid);
            return this.performCleanup(playlistBcids);
        }).then(bcids => {
            return this.preparePlaylistTable().then(db => {
                let bcidStr = bcids.join(',');
                return db.executeSql('DELETE FROM downloads WHERE bcid IN (?)', [bcidStr]);
            })
        }).then(a => {
            return this.getDownloadedVideosOf(userId);
        }).then(downloadEntries => {
            let thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            let bcidsOfExpiredVideos = downloadEntries.filter(d => {
                return d.dl_date.getDate() <= Date.now();
            }).map(d => d.bcid);

            return new Promise<boolean>((resolve, reject) => {
                resolve(bcidsOfExpiredVideos.length === 0);
            });
        });
    }

    removeAllExpiredVideosFor(userId: string) {
        return this.getDownloadedVideosOf(userId).then(downloadEntries => {
            let thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            let bcidsOfExpiredVideos = downloadEntries.filter(d => {
                return d.dl_date.getDate() <= Date.now();
            }).map(d => d.bcid);

            return this.performCleanup(bcidsOfExpiredVideos);
        }).then(bcids => {
            return this.preparePlaylistTable().then(db => {
                let bcidStr = bcids.join(',');
                return db.executeSql('DELETE FROM downloads WHERE bcid IN (?)', [bcidStr]);
            })
        }).then(a => {
            return this.getDownloadedVideosOf(userId);
        }).then(downloadEntries => {
            let thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            let bcidsOfExpiredVideos = downloadEntries.filter(d => {
                return d.dl_date.getDate() <= Date.now();
            }).map(d => d.bcid);

            return new Promise<boolean>((resolve, reject) => {
                resolve(bcidsOfExpiredVideos.length === 0);
            });
        });
    }

    private performCleanup(bcids: string[]) {
        return new Promise<string[]>((resolve, reject) => {
            try {
                bcids.forEach(bcid => {
                    // delete all videos with the filenames `<bcid>.mp4`
                });
                resolve(bcids);
            } catch (e) {
                reject(e);
            }
        })
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
                        dl_date TEXT NOT NULL)`, {})
                    .then(() => { resolve(db); })
                    .catch(e => { reject(e); })
            } catch (e) {
                reject(e);
            }
        });
    }
}