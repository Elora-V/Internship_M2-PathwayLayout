// Plugins
import { loadFonts } from "./webfontloader";
import vuetify from "./vuetify";

export function registerPlugins(app: any) {
  loadFonts();
  app.use(vuetify);
}
