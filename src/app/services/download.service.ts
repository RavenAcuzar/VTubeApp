import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import { Subscriber } from "rxjs/Subscriber";
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { openSqliteDb } from "../app.utils";
import { DownloadEntry } from "../models/download.models";
<<<<<<< HEAD
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
=======
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
>>>>>>> 3874b2977c2b9eaaf7c541882862c64b2f786888
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

<<<<<<< HEAD
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
=======
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
>>>>>>> 3874b2977c2b9eaaf7c541882862c64b2f786888
                return db.executeSql('INSERT INTO downloads(bcid, memid, dl_date) VALUES(?, ?, ?)', [
                    bcid, userId, new Date().toLocaleDateString()
                ])
            }).then(a => {
                if (a.rowsAffected === 1) {
<<<<<<< HEAD
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
=======
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
>>>>>>> 3874b2977c2b9eaaf7c541882862c64b2f786888
        })
    }

    removeVideoFor(userId: string, bcid: string) {
        return this.preparePlaylistTable().then(db => {
            return db.executeSql('DELETE FROM downloads WHERE memid = ? and bcid = ?', [userId, bcid])
        }).then(a => {
<<<<<<< HEAD
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
=======
            return new Promise<boolean>((resolve, reject) => {
                if (a.rowsAffected === 1)
                    resolve(true)
                else if (a.rowsAffected === 0)
                    reject(false)
                else
                    reject({ error: 'Multiple values were deleted!' })
            })
>>>>>>> 3874b2977c2b9eaaf7c541882862c64b2f786888
        })
    }

    removeAllVideosFor(userId: string) {
        return this.getDownloadedVideosOf(userId).then(downloadEntries => {
<<<<<<< HEAD
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
=======
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
>>>>>>> 3874b2977c2b9eaaf7c541882862c64b2f786888
            });
        });
    }

    removeAllExpiredVideosFor(userId: string) {
        return this.getDownloadedVideosOf(userId).then(downloadEntries => {
            let thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

<<<<<<< HEAD
            // filter videos which are past the expiration data
=======
>>>>>>> 3874b2977c2b9eaaf7c541882862c64b2f786888
            let bcidsOfExpiredVideos = downloadEntries.filter(d => {
                return d.dl_date.getDate() <= Date.now();
            }).map(d => d.bcid);

<<<<<<< HEAD
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
=======
            return this.performCleanup(bcidsOfExpiredVideos);
        }).then(bcids => {
            return this.preparePlaylistTable().then(db => {
                let bcidStr = bcids.join(',');
                return db.executeSql('DELETE FROM downloads WHERE bcid IN (?)', [bcidStr]);
            })
        }).then(a => {
            return this.getDownloadedVideosOf(userId);
        }).then(downloadEntries => {
>>>>>>> 3874b2977c2b9eaaf7c541882862c64b2f786888
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
<<<<<<< HEAD
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
=======
                bcids.forEach(bcid => {
                    // delete all videos with the filenames `<bcid>.mp4`
                });
                resolve(bcids);
>>>>>>> 3874b2977c2b9eaaf7c541882862c64b2f786888
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