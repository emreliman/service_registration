const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

let db = new sqlite3.Database("./vehicle-maintenance.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the vehicle maintenance database.");
});

// create table
db.run(
  `CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer TEXT NOT NULL,
      vehiclePlate TEXT NOT NULL,
      vehicleModel TEXT NOT NULL,
      vehicleKm TEXT NOT NULL,
      vehicleContact TEXT NOT NULL,
      changeDate TEXT NOT NULL,
      note TEXT NOT NULL,
      operation TEXT NOT NULL
    )`,
  (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Created the vehicles table.");
  }
);
ipcMain.handle('dialog', async (event, msg) => {
  // confirm dialog
  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Evet', 'Hayır'],
    title: 'Confirm',
    message: msg.toString(),
  });
  return response === 0;
})

ipcMain.handle("db-query", async (event, sqlQuery) => {
  return new Promise((res) => {
    db.all(sqlQuery, (err, rows) => {
      res(rows);

      if (err) {
        console.error(err.message);
      }
    });
  });
});

ipcMain.on("open-summary",() =>{
  win.loadFile("src/chart.html");
})

// db.close()

let mainWindow;
let win;
function loadIndex() {
  win.loadFile("src/index.html");
}

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1000,
    height: 1000,
    backgroundColor: '#56cc5b10',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, "/preload.js"),
      nativeWindowOpen: true,
      devTools: false,
    },
  });

  // Load the index.html file of the app.
  win.loadFile("src/index.html");

  win.webContents.on("dom-ready", function () {
    win.webContents.send("display-records", { SAVED: "File Saved" });
  });

  ipcMain.on("open-records", () => {
    win.loadFile("src/records.html");
  });
  ipcMain.on("back-to-index", () => {
    loadIndex();
  });

  // Open the DevTools.
  win.webContents.openDevTools();

  // create the Menu
  const template = [
    {
      label: "Islemler",
      click() {
        ipcMain.emit("open-records");
      },

      /*
      submenu: [
        {
          label: "Results",
          click() {
            ipcMain.emit('open-records')
          },
        },
        { role: 'quit' }
      ]
      */
    },
    {
      label: "Cikis",
      click() {
        app.quit();
      },
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on("ready", () => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  mainWindow.loadFile("src/records.html");
});



