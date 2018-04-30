"use strict";

import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import path from "path";
import os from "os";
import klawSync from "klaw-sync";
import psList from "ps-list";
import kill from "tree-kill";
import fs from "fs-extra";
import { extend, find, filter, each, map, findIndex, isnull } from "lodash";
import pidusage from "pidusage";

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== "development") {
  global.__static = require("path")
    .join(__dirname, "/static")
    .replace(/\\/g, "\\\\");
}

let electron_apps = [];
let mainWindow;
const winURL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`;

function createWindow() {
  mainWindow = new BrowserWindow({
    center: true,
    height: 410,
    useContentSize: false,
    resizable: false,
    width: 570,
    frame: false
  });

  mainWindow.loadURL(winURL);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

fs.readdir(path.join("/Applications")).then(applications => {
  for (let app of applications) {
    let frameworks_path = path.join("/Applications/", app, "Contents", "Frameworks");

    try {
      for (let framework of klawSync(frameworks_path)) {
        if (framework.path.includes("Electron Framework.framework")) {
          electron_apps.push(app);
          break;
        }
      }
    } catch (er) {}
  }

  return electron_apps;
});

ipcMain.on("kill-processes", (e, processes) => {
  each(processes, process => {
    kill(process.pid);
  });
});

ipcMain.on("get-totalmem", e => {
  e.sender.send("totalmem", os.totalmem());
});

ipcMain.on("get-processes", e => {
  psList()
    .then(processes => {
      let electron_processes = filter(processes, process => {
        for (let electron_app of electron_apps) {
          if (process.cmd.includes(electron_app)) {
            return true;
          }
        }
      });
      return electron_processes;
    })
    .then(processes => {
      pidusage(map(processes, "pid")).then(stats => {
        each(stats, stat => {
          let index = findIndex(processes, { pid: stat.pid });
          processes[index].stats = stat;

          e.sender.send("running-electron-processes", processes);
        });
      });
    });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("ready", createWindow);

app.on("activate", () => {
  if (isNull(mainWindow)) {
    createWindow();
  }
});
