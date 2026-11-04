const { app, BrowserWindow, dialog, ipcMain, Menu } = require("electron");
const { readFile, writeFile } = require("node:fs/promises");
const path = require("node:path");

const settingsPath = () => path.join(app.getPath("userData"), "settings.json");
let mainWindow;

function normalizeSiteUrl(raw) {
  if (typeof raw !== "string") {
    throw new Error("Укажите адрес веб-версии AutoFix.");
  }
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("Введите полный адрес сайта, например https://autofix.example.com");
  }
  const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if ((url.protocol !== "https:" && !localHttp) || url.username || url.password) {
    throw new Error("Используйте HTTPS-адрес AutoFix. HTTP разрешён только для localhost.");
  }
  return url.toString().replace(/\/+$/, "");
}

async function readSiteUrl() {
  try {
    const stored = JSON.parse(await readFile(settingsPath(), "utf8"));
    return normalizeSiteUrl(stored.siteUrl);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function createSetupWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
  const setupWindow = new BrowserWindow({
    width: 580,
    height: 520,
    minWidth: 420,
    minHeight: 420,
    title: "Настройка AutoFix",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = setupWindow;
  setupWindow.on("closed", () => {
    if (mainWindow === setupWindow) mainWindow = null;
  });
  void setupWindow.loadFile(path.join(__dirname, "setup.html"));
}

function installSerialPermissions(window, siteUrl) {
  const trustedOrigin = new URL(siteUrl).origin;
  const ses = window.webContents.session;

  ses.setPermissionCheckHandler((contents, permission, requestingOrigin) =>
    permission === "serial" && contents === window.webContents && requestingOrigin === trustedOrigin,
  );
  ses.setPermissionRequestHandler((contents, permission, callback) => {
    callback(permission === "serial" && contents === window.webContents && new URL(contents.getURL()).origin === trustedOrigin);
  });
  ses.setDevicePermissionHandler((details) =>
    details.deviceType === "serial" && details.origin === trustedOrigin,
  );
  const onSelectSerialPort = (event, contents, devices, callback) => {
    if (contents !== window.webContents) {
      callback("");
      return;
    }
    event.preventDefault();
    if (devices.length === 0) {
      callback("");
      return;
    }
    const labels = devices.map((device, index) => {
      const ids = device.vendorId && device.productId ? ` · USB ${device.vendorId}:${device.productId}` : "";
      return `${device.portName || "Последовательный порт"}${ids} (#${index + 1})`;
    });
    void dialog.showMessageBox(window, {
      type: "question",
      title: "Выберите адаптер ELM327",
      message: "Выберите USB-порт автомобильного адаптера.",
      buttons: [...labels, "Отмена"],
      cancelId: labels.length,
      defaultId: 0,
    }).then(({ response }) => {
      callback(devices[response]?.portId ?? "");
    }, (error) => {
      console.error("Не удалось показать список USB-портов:", error);
      callback("");
    });
  };
  ses.on("select-serial-port", onSelectSerialPort);
  window.on("closed", () => {
    ses.removeListener("select-serial-port", onSelectSerialPort);
    if (mainWindow === window) mainWindow = null;
  });
}

function createAppWindow(siteUrl) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 860,
    minHeight: 640,
    title: "AutoFix",
    backgroundColor: "#0b1110",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  installSerialPermissions(mainWindow, siteUrl);
  void mainWindow.loadURL(siteUrl);
}

ipcMain.handle("autofix:save-site-url", async (event, raw) => {
  if (!event.senderFrame.url.startsWith("file://")) {
    throw new Error("Адрес можно изменить только в окне настройки AutoFix.");
  }
  if (typeof raw !== "string") throw new Error("Укажите адрес веб-версии AutoFix.");
  const siteUrl = normalizeSiteUrl(raw);
  await writeFile(settingsPath(), JSON.stringify({ siteUrl }, null, 2), "utf8");
  createAppWindow(siteUrl);
  return true;
});

app.whenReady().then(async () => {
  const siteUrl = await readSiteUrl();
  const template = [{
    label: "AutoFix",
    submenu: [
      { label: "Изменить адрес веб-версии", click: createSetupWindow },
      { type: "separator" },
      { role: "quit", label: "Выйти" },
    ],
  }];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  if (siteUrl) createAppWindow(siteUrl);
  else createSetupWindow();
}).catch((error) => {
  dialog.showErrorBox("Не удалось запустить AutoFix", error instanceof Error ? error.message : String(error));
  app.quit();
});
