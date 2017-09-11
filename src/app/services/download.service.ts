import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import { Subscriber } from "rxjs/Subscriber";
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { openSqliteDb } from "../app.utils";
import { DownloadEntry } from "../models/download.models";
import { File, RemoveResult } from '@ionic-native/file';
import { FileTransfer, FileTransferObject } from "@ionic-native/file-transfer";
import { Platform } from "ionic-angular";
import { Http } from "@angular/http";
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';

type BcidAndResult = {
    bcid: string,
    result: RemoveResult
}

@Injectable()
export class DownloadService {
    private rootPath: string;

    constructor(
        private fileTransfer: FileTransfer,
        private platform: Platform,
        private sqlite: SQLite,
        private file: File,
        private http: Http
    ) { 
        if (this.platform.is('ios')) {
            this.rootPath = `${this.file.dataDirectory}/vtube/videos`;
        } else if (this.platform.is('android')) {
            this.rootPath = `${this.file.externalDataDirectory}/vtube/videos`;
        } else {
            throw new Error('Platform not supported.');
        }
    }

    getRootPath() {
        return this.rootPath;
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

    isVideoDownloaded(userId: string, bcid: string) {
        return this.preparePlaylistTable().then(db => {
            return db.executeSql('SELECT * FROM downloads WHERE memid = ?, bcid = ?', [userId, bcid])
        }).then(a => {
            if (a.rows.length !== 1) 
                throw new Error('Multiple entries detected!');
            return a.rows.length === 1;
        }).then(isInManifest => {
            return this.file.checkFile(`${this.rootPath}`, `${bcid}.mp4`).then(isPresent => {
                return isInManifest && isPresent;
            });
        });
    }

    addVideoFor(userId: string, email: string, bcid: string) {
        return new Promise<Observable<number>>((resolve, reject) => {
            this.preparePlaylistTable().then(db => {
                // save entry to local database
                return db.executeSql('INSERT INTO downloads(bcid, memid, dl_date) VALUES(?, ?, ?)', [
                    bcid, userId, new Date().toLocaleDateString()
                ])
            }).then(a => {
                if (a.rowsAffected === 1) {
                    // get the download url of the video
                    let url = `http://cums.the-v.net/vid.aspx?id=${bcid}&irid=${email}`;
                    return this.http.get(url).map(response => response.text()).toPromise();
                } else {
                    reject({ error: 'Download entry was not successfully inserted.' })
                }
            }).then(finalUrl => {
                return this.file.checkFile(`${this.rootPath}`, `${bcid}.mp4`).then(s => {
                    if (s) {
                        return this.file.removeFile(`${this.rootPath}`, `${bcid}.mp4`).then(r => {
                            return finalUrl;                            
                        });
                    } else {
                        return finalUrl;
                    }
                });
            }).then(finalUrl => {
                // start download of the video and return an observable so 
                // the download progress can be observed
                
                if (finalUrl === null || finalUrl === '') {
                    reject({ error: 'Final URL is null or empty.' });
                } else {
                    resolve(new Observable((observer: Subscriber<number>) => {
                        let path = `${this.rootPath}/${bcid}.mp4`;

                        let fileTransferObject = this.fileTransfer.create();
                        fileTransferObject.onProgress(e => {
                            let progress = (e.lengthComputable) ?  Math.floor(e.loaded / e.total * 100) : -1;
                            observer.next(progress);
                        });
                        fileTransferObject.download(finalUrl, path, true).then(entry => {
                            observer.complete();
                        }).catch(e => {
                            observer.error(e);
                        });
                        
                        return () => { /* cleaup logic */ }
                    }));
                }
            })
        })
    }

    removeVideoFor(userId: string, bcid: string) {
        return this.preparePlaylistTable().then(db => {
            return db.executeSql('DELETE FROM downloads WHERE memid = ? and bcid = ?', [userId, bcid])
        }).then(a => {
            if (a.rowsAffected === 1)
                return true;
            else if (a.rowsAffected === 0)
                return false;
            else
                throw new Error('Multiple values were deleted!' );
        }).then(isManifestUpdated => {
            return this.file.checkFile(`${this.rootPath}`, `${bcid}.mp4`).then(isPresent => {
                if (isPresent)
                    return this.file.removeFile(`${this.rootPath}`, `${bcid}.mp4`);
                else
                    throw new Error('Non existent file!');
            });
        }).then(result => {
            return result.success;
        })
    }

    removeAllVideosFor(userId: string) {
        return this.getDownloadedVideosOf(userId).then(downloadEntries => {
            // get all entries for the specified user
            let playlistBcids = downloadEntries.map(d => d.bcid);

            // delete all the downloaded videos of the users 
            return this.performCleanup(playlistBcids);
        }).then(bcids => {
            // delete all the entries of the deleted videos
            return this.preparePlaylistTable().then(db => {
                let bcidStr = bcids.join(',');
                return db.executeSql('DELETE FROM downloads WHERE bcid IN (?)', [bcidStr]);
            });
        }).then(a => {
            // retrieve all the entries of the downloaded videos again
            return this.getDownloadedVideosOf(userId);
        }).then(downloadEntries => {
            // perform checking again to make sure if there are still entries for the user
            let bcidsOfVideos = downloadEntries.map(d => d.bcid);
            return new Promise<boolean>((resolve, reject) => {
                resolve(bcidsOfVideos.length === 0);
            });
        });
    }

    removeAllExpiredVideosFor(userId: string) {
        return this.getDownloadedVideosOf(userId).then(downloadEntries => {
            let thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            // filter videos which are past the expiration data
            let bcidsOfExpiredVideos = downloadEntries.filter(d => {
                return d.dl_date.getDate() <= Date.now();
            }).map(d => d.bcid);

            // delete all the videos in list from storage
            return this.performCleanup(bcidsOfExpiredVideos);
        }).then(bcids => {
            // delete all entries of the videos which are successfully deleted from the storage
            return this.preparePlaylistTable().then(db => {
                let bcidStr = bcids.join(',');
                return db.executeSql('DELETE FROM downloads WHERE bcid IN (?)', [bcidStr]);
            });
        }).then(_ => {
            // retrieve all the entries of the downloaded videos again
            return this.getDownloadedVideosOf(userId);
        }).then(downloadEntries => {
            // perform checking again to make sure if there are still expired entries
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
                let promises: Promise<BcidAndResult>[] = [];
                bcids.forEach(bcid => {
                    let promise = this.file.checkFile(`${this.rootPath}`, `${bcid}.mp4`).then(s => {
                        if (s) return this.file.removeFile(`${this.rootPath}`, `${bcid}.mp4`);
                    }).then(result => {
                        return { bcid: bcid, result: result }
                    });
                    promises.push(promise);
                });
                Promise.all(promises).then(p => {
                    if (p.every(r => r.result.success)) {
                        resolve(p.map(r => r.bcid));
                    } else {
                        let successfulDeletions = p.filter(r => r.result.success);
                        resolve(successfulDeletions.map(r => r.bcid));
                    }
                });
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