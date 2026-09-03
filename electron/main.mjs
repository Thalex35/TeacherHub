import { app, BrowserWindow, dialog, net, protocol, shell } from "electron";
import { autoUpdater } from "electron-updater";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const APP_SCHEME = "app";
const DEV_URL = process.env.ELECTRON_START_URL;
let mainWindow;

function publicRoot() {
  return join(app.getAppPath(), ".output", "public");
}

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
    const allowed = DEV_URL ? url.startsWith(DEV_URL) : url.startsWith(`${APP_SCHEME}://`);
    if (!allowed) {
      event.preventDefault();
      openExternal(url);
    }
  });

  if (DEV_URL) void mainWindow.loadURL(DEV_URL);
  else void mainWindow.loadURL(`${APP_SCHEME}://index.html`);
}

function registerAppProtocol() {
  protocol.handle(APP_SCHEME, async (request) => {
    const requestedPath = new URL(request.url).pathname.replace(/^\/+/, "");
    const root = resolve(publicRoot());
    const candidate = resolve(root, requestedPath || "index.html");
    const isInsideRoot = relative(root, candidate) && !relative(root, candidate).startsWith("..");
    const safeCandidate = isInsideRoot ? candidate : join(root, "index.html");
    const fallback = join(root, "index.html");
    const fileUrl = pathToFileURL(safeCandidate).toString();
    const response = await net.fetch(fileUrl);
    if (response.ok) return response;
    return net.fetch(pathToFileURL(fallback).toString());
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
      message: `Children Management ${result.updateInfo.version} is available.`,
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
    detail: "Restart Children Management now to install it.",
  });
  if (choice.response === 0) autoUpdater.quitAndInstall();
});

if (!DEV_URL) {
  protocol.registerSchemesAsPrivileged([
    { scheme: APP_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ]);
}

app.whenReady().then(() => {
  if (!DEV_URL) registerAppProtocol();
  createWindow();
  setTimeout(() => void checkForUpdates(), 10000);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
