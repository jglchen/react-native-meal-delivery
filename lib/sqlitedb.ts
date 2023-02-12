import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { DATABASE_NAME } from './constants';

export function openSQLiteDB() {
    if (Platform.OS === "web") {
      return {
        transaction: () => {
          return {
            executeSql: () => {},
          };
        },
      };
    }
  
    const db = SQLite.openDatabase(DATABASE_NAME);
    return db;
}
  
