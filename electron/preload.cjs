const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("budjetDesktop", {
  isDesktop: true,
});
