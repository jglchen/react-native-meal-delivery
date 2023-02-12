import { openSQLiteDB } from './sqlitedb';
const db = openSQLiteDB();

export const iniTableShopList = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS shoplist (id TEXT PRIMARY KEY NOT NULL, shopname TEXT, foodsupply TEXT, profileimage TEXT, owner TEXT, onboard INT, created TEXT)',
        [],
        () => resolve(),
        (_, err) => reject(err),
      );
    });
  });
};

export const iniTableBlockUsers = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS blockusers (shopid TEXT NOT NULL, userid TEXT NOT NULL, PRIMARY KEY(shopid, userid))',
        [],
        () => resolve(),
        (_, err) => reject(err),
      );
    });
  });
};

export const iniTableUpdateFreq = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS updatefreq (id TEXT PRIMARY KEY NOT NULL, updatetime REAL)',
        [],
        () => resolve(),
        (_, err) => reject(err),
      );
    });
  });
};

export const iniTableImage = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS image (id TEXT PRIMARY KEY NOT NULL, mimetype TEXT, base64 BLOB)',
        [],
        () => resolve(),
        (_, err) => reject(err),
      );
    });
  });
};

export const iniTableMealList = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS meallist (shopid TEXT NOT NULL, id TEXT NOT NULL, mealname TEXT, mealdescr TEXT, unitprice REAL, profileimage TEXT, created TEXT, PRIMARY KEY(shopid, id))',
        [],
        () => resolve(),
        (_, err) => reject(err),
      );
    });
  });
};

export const deleteShopList = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM shoplist',
        [],
        (_, result) => resolve(result),
        (_, err) => reject(err),
      );
    });
  });
};

export const deleteBlockUsers = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM blockusers',
        [],
        (_, result) => resolve(result),
        (_, err) => reject(err),
      );
    });
  });
};

export const deleteMealListByShopId = (shopid) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM meallist WHERE shopid = ?',
        [shopid],
        (_, result) => resolve(result),
        (_, err) => reject(err),
      );
    });
  });
};

export const insertShopList = (id, shopname, foodsupply, profileimage, owner, onboard, created) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO shoplist (id, shopname, foodsupply, profileimage, owner, onboard, created) VALUES(?, ?, ?, ?, ?, ?, ?)',
        [id, shopname, foodsupply, profileimage, owner, onboard, created],
        (_, result) => resolve(result),
        (_, err) => reject(err),
      );
    });
  });
};

export const insertBlockUsers = (shopid, userid) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO blockusers(shopid, userid) VALUES(?, ?)',
        [shopid, userid],
        (_, result) => resolve(result),
        (_, err) => reject(err),
      );
    });
  });
};

export const insertMealList = (shopid, id, mealname, mealdescr, unitprice, profileimage, created) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO meallist (shopid, id, mealname, mealdescr, unitprice, profileimage, created) VALUES(?, ?, ?, ?, ?, ?, ?)',
        [shopid, id, mealname, mealdescr, unitprice, profileimage, created],
        (_, result) => resolve(result),
        (_, err) => reject(err),
      );
    });
  });
};

export const replaceIntoImage = (id, mimetype, base64) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'REPLACE INTO image(id, mimetype, base64) VALUES(?, ?, ?)',
        [id, mimetype, base64],
        (_, result) => resolve(result),
        (_, err) => reject(err),
      );
    });
  });
};

export const updateUpdateFreq = (id, currtime) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'REPLACE INTO updatefreq (id, updatetime) VALUES(?, ?)',
        [id, currtime],
        (_, result) => resolve(result),
        (_, err) => reject(err),
      );
    });
  });
};

export const getShopList = () => {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM shoplist',
          [],
          (_, result) => resolve(result),
          (_, err) => reject(err),
        );
      });
    });
};

export const getBlockUsers = (shopid) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM blockusers where shopid = ?',
        [shopid],
        (_, result) => resolve(result),
        (_, err) => reject(err),
      );
    });
  });
};

export const getUpdateTime = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM updatefreq where id = ?',
        [id],
        (_, result) => resolve(result),
        (_, err) => reject(err),
      );
    });
  });
};

export const getImageById = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM image where id = ?',
        [id],
        (_, result) => resolve(result),
        (_, err) => reject(err),
      );
    });
  });
};

export const getMealList = (shopid) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM meallist where shopid = ? ORDER BY created DESC',
        [shopid],
        (_, result) => resolve(result),
        (_, err) => reject(err),
      );
    });
  });
};
