import { app, BrowserWindow, dialog, shell } from "electron";
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import updaterPackage from "electron-updater";
import { join } from "node:path";

const DEV_URL = process.env.ELECTRON_START_URL;
const SERVER_PORT = 4173;
const APP_URL = `http://127.0.0.1:${SERVER_PORT}`;
const { autoUpdater } = updaterPackage;
let mainWindow;
let serverProcess;

function openExternal(url) {
  try {
    const parsed = new URL(url);
    if (["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      void shell.openExternal(parsed.href);
    }
  } catch {
    // Ignore malformed navigation targets.
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: "#f7fafb",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(app.getAppPath(), "electron", "preload.cjs"),
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowed = DEV_URL ? url.startsWith(DEV_URL) : url.startsWith(APP_URL);
    if (!allowed) {
      event.preventDefault();
      openExternal(url);
    }
  });

  if (DEV_URL) void mainWindow.loadURL(DEV_URL);
  else void mainWindow.loadURL(APP_URL);
}

function startServer() {
  const serverEntry = join(app.getAppPath(), ".output", "server", "index.mjs");
  serverProcess = spawn(process.execPath, [serverEntry], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      PORT: String(SERVER_PORT),
      HOST: "127.0.0.1",
    },
    stdio: "ignore",
  });
  serverProcess.on("error", () => {
    serverProcess = undefined;
  });
}

function waitForServer() {
  return new Promise((resolvePromise, reject) => {
    const startedAt = Date.now();
    const check = () => {
      const connection = createConnection({ host: "127.0.0.1", port: SERVER_PORT });
      connection.once("connect", () => {
        connection.destroy();
        resolvePromise();
      });
      connection.once("error", () => {
        connection.destroy();
        if (Date.now() - startedAt > 15000)
          reject(new Error("The local app server did not start."));
        else setTimeout(check, 100);
      });
    };
    check();
  });
}

async function checkForUpdates() {
  if (!app.isPackaged) return;
  try {
    autoUpdater.setFeedURL({ provider: "github", owner: "Thalex35", repo: "TeacherHub" });
    const result = await autoUpdater.checkForUpdates();
    if (!result?.updateInfo || result.updateInfo.version === app.getVersion()) return;
    const choice = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["Download update", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Update available",
      message: `TeacherHub ${result.updateInfo.version} is available.`,
      detail: "The update will be downloaded from the configured GitHub Releases repository.",
    });
    if (choice.response === 0) await autoUpdater.downloadUpdate();
  } catch {
    // Updating is optional; a failed check must never block the application.
  }
}

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.on("update-downloaded", async () => {
  const choice = await dialog.showMessageBox(mainWindow, {
    type: "info",
    buttons: ["Restart and install", "Later"],
    defaultId: 0,
    cancelId: 1,
    title: "Update ready",
    message: "The update has been downloaded.",
    detail: "Restart TeacherHub now to install it.",
  });
  if (choice.response === 0) autoUpdater.quitAndInstall();
});

app.whenReady().then(() => {
  if (!DEV_URL) startServer();
  void (DEV_URL ? Promise.resolve() : waitForServer())
    .then(() => createWindow())
    .catch(() => app.quit());
  setTimeout(() => void checkForUpdates(), 10000);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  serverProcess?.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => serverProcess?.kill());
