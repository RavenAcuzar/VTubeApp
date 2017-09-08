import { SQLite } from "@ionic-native/sqlite";
import { SQLITE_DB_NAME } from "./app.constants";

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

export function openSqliteDb(sqlite: SQLite) {
    return sqlite.create({
        name: SQLITE_DB_NAME,
        location: 'default'
    })
}