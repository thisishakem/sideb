import { app, Tray, Menu, nativeImage } from 'electron';

export class TrayMenu {
  public readonly tray: Tray;
  private iconPath: string = '/assets/electron.svg'; // Path to the icon filenpm

  constructor() {
    this.tray = new Tray(this.createNativeImage());
  }

  createNativeImage() {
    const path = `${app.getAppPath()}${this.iconPath}`;
    const image = nativeImage.createFromPath(path);
    image.setTemplateImage(true);  // Marks the image as template
    return image;
  }

  setMenu(menu: Menu) {
    this.tray.setContextMenu(menu);
  }

  setTooltip(tooltip: string) {
    this.tray.setToolTip(tooltip);
  }
}
