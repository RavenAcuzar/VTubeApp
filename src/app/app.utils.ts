import { SQLite } from "@ionic-native/sqlite";
import { SQLITE_DB_NAME } from "./app.constants";


/////////////////////Number Formater for followers, likes, views, etc//////////////////

export interface StringMap {
    [id: string]: any
}

const AMPERSAND = '&'
export function encodeObject(object: StringMap) {
    let encStrArray = []
    for (let key in object) {
        if (object.hasOwnProperty(key)) {
            let o = object[key]
            encStrArray.push(key, String(o), AMPERSAND)
        }
    }
    encStrArray.pop()
    return encodeURIComponent(encStrArray.join(''))
}
export function formatDate(date) {
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return monthNames[monthIndex] + ' ' + day + ', ' + year;
}

export function openSqliteDb(sqlite: SQLite) {
    return sqlite.create({
        name: SQLITE_DB_NAME,
        location: 'default'
    })
}
