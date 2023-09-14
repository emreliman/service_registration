const os = require("os");
const path = require("path");
const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const sqlite3 = require("sqlite3");
const Toastify = require('toastify-js');

function connection(
  customer,
  vehiclePlate,
  vehicleModel,
  vehicleKm,
  vehicleContact,
  changeDate,
  note,
  operation
) {
  let db = new sqlite3.Database("./vehicle-maintenance.db", (err) => {
    console.log(
      customer,
      vehiclePlate,
      vehicleModel,
      vehicleKm,
      vehicleContact,
      changeDate,
      note,
      operation
    );
    if (err) {
      console.error(err.message);
    }
    db.run(
      `INSERT INTO vehicles(customer, vehiclePlate, vehicleModel, vehicleKm, vehicleContact, changeDate,note, operation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer,
        vehiclePlate,
        vehicleModel,
        vehicleKm,
        vehicleContact,
        changeDate,
        note,
        operation,
      ],
      function (err) {
        if (err) {
          return console.log(err.message);
        }
        console.log(`A row has been inserted with rowid ${this.lastID}`);
      }
    );
    console.log("Connected to the vehicle maintenance database.");
  });
  db.close();
}

contextBridge.exposeInMainWorld("os", {
  homedir: () => os.homedir(),
});

contextBridge.exposeInMainWorld("path", {
  join: (...args) => path.join(...args),
});

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  invoke: (str, sql) => ipcRenderer.invoke(str, sql),
  on: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
});

contextBridge.exposeInMainWorld("fs", {
  statSync: (str) => fs.statSync(str),
  existsSync: (str) => fs.existsSync(str),
  mkdirSync: (str) => fs.mkdirSync(str),
  renameSync: (str1, str2) => fs.renameSync(str1, str2),
  rmdirSync: (str) => fs.rmdirSync(str),
  readdirSync: (str) => fs.readdirSync(str),
  isDirectory: (str) => fs.statSync(str).isDirectory(),
});

contextBridge.exposeInMainWorld('Toastify', {
  toast: (options) => Toastify(options).showToast(),
});

// sqlite
contextBridge.exposeInMainWorld("sqlite3", {
  Database: (str) => new sqlite3.Database(str),
  verbose: () => sqlite3.verbose(),
  connection: (
    customer,
    vehiclePlate,
    vehicleModel,
    vehicleKm,
    vehicleContact,
    changeDate,
    note,
    operation
  ) =>
    connection(
      customer,
      vehiclePlate,
      vehicleModel,
      vehicleKm,
      vehicleContact,
      changeDate,
      note,
      operation
    ),
});
