import * as _ from "lodash";
import db from "../connections/sqlConnection.mjs";
const custom = {
  log: (message, ...arrayOfMessages) => {
    if (process.env.TRACE === "true") {
      console.log(message, ...arrayOfMessages);
    }
  },
};

class DB {
  async getConnection() {
    try {
      if (!db.hasOwnProperty("connection")) {
        let database = await db.getConnection();
        return database.connection;
      }
      return db;
    } catch (error) {
      throw error;
    }
  }
  async getRecords(table, fields, where = "", whereParams = "", others = "") {
    let connection = await this.getConnection();
    try {
      return new Promise(async (resolve, reject) => {
        table = "`" + table + "`";
        if (_.isEmpty(fields)) {
          fields = "*";
        }

        // if (_.isEmpty(where)) {
        //     where = 'id != "" ';
        // }

        let sql = `SELECT ${fields} from ${table}`;
        if (where != "") {
          sql += ` where ${where}`;
        }
        if (others != "") {
          sql += ` ${others}`;
        }
        //   console.log(connection.format(sql, [whereParams]));
        try {
          const [articleRow, articleFields] = await connection
            .promise()
            .query(sql, [whereParams]);
          resolve(articleRow);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      return error;
    } finally {
      connection.release();
    }
  }
  async insertRecords(table, params, quesParam, values) {
    let connection = await this.getConnection();
    // console.log(connection._pool._freeConnections.length )
    try {
      return new Promise(async (resolve, reject) => {
        table = "`" + table + "`";
        let sql;
        if (quesParam.length) {
          sql = `INSERT into ${table} (${params}) VALUES (${quesParam})`;
        } else {
          sql = `INSERT into ${table} (${params}) VALUES ?`;
        }

        try {
          // console.log(connection.format(sql, values));
          const [articleRow, articleFields] = await connection
            .promise()
            .query(sql, values);
          resolve(articleRow);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      // console.log("========inserted");
      return error;
    } finally {
      await connection.release();
      // console.log(connection._pool._freeConnections.length )
    }
  }

  async upsertRecords(table, params, quesParam, values, status) {
    let connection = await this.getConnection();
    // console.log(connection._pool._freeConnections.length )
    try {
      return new Promise(async (resolve, reject) => {
        table = "`" + table + "`";
        let sql;
        if (quesParam.length) {
          sql = `INSERT into ${table} (${params}) VALUES (${quesParam}) ON DUPLICATE KEY UPDATE    
          status='${status}'`;
        } else {
          sql = `INSERT into ${table} (${params}) VALUES ? ON DUPLICATE KEY UPDATE    
          status='${status}'`;
        }

        try {
          // console.log(connection.format(sql, values));
          const [articleRow, articleFields] = await connection
            .promise()
            .query(sql, values);
          resolve(articleRow);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      // console.log("========inserted");
      return error;
    } finally {
      await connection.release();
      // console.log(connection._pool._freeConnections.length )
    }
  }

  async updateRecords(table, setParams, where, values, type = "single") {
    let connection = await this.getConnection();
    try {
      return new Promise(async (resolve, reject) => {
        table = "`" + table + "`";
        // let sql = `UPDATE ${table} SET ${setParams} = ? where ${where}`;
        if (type == "single")
          var sql = "UPDATE " + table + " SET " + setParams + " where " + where;
        else
          var sql =
            "UPDATE " + table + " SET " + setParams + " = ? where " + where;

        try {
          // console.log(connection.format(sql, values));
          const [articleRow, articleFields] = await connection
            .promise()
            .query(sql, values);
          resolve(articleFields);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.log(error);
      return error;
    } finally {
      connection.release();
    }
  }
  async deleteRecord(table, where) {
    let connection = await this.getConnection();
    try {
      return new Promise(async (resolve, reject) => {
        table = "`" + table + "`";
        let sql = `DELETE FROM ${table} WHERE ${where}`;
        custom.log(sql);
        try {
          const [articleRow, articleFields] = await connection
            .promise()
            .query(sql);
          resolve(articleRow);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      return error;
    } finally {
      connection.release();
    }
  }
  async customSql(sql) {
    let connection = await this.getConnection();
    try {
      return new Promise(async (resolve, reject) => {
        try {
          const [articleRow, articleFields] = await connection
            .promise()
            .query(sql);
          resolve(articleRow);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      return error;
    } finally {
      connection.release();
    }
  }
}

export default DB;
