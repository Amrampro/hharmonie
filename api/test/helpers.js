import vm from "node:vm";
import { readFile } from "node:fs/promises";

// Load the real controller with isolated database/mail dependencies.
export async function loadController(name, database, overrides = {}, environment = {}) {
  const context = vm.createContext({ console: { error() {}, log() {} }, process: { env: environment } });
  const cache = new Map();
  async function load(url) {
    if (cache.has(url)) return cache.get(url);
    let module;
    const stub = url.endsWith("/config/database.js") ? database : overrides[url.split("/").pop()];
    if (stub) {
      module = new vm.SyntheticModule(Object.keys(stub), function () {
        for (const [key, value] of Object.entries(stub)) this.setExport(key, value);
      }, { context, identifier: url });
    } else if (!url.startsWith("file:")) {
      const native = await import(url);
      module = new vm.SyntheticModule(Object.keys(native), function () {
        for (const [key, value] of Object.entries(native)) this.setExport(key, value);
      }, { context, identifier: url });
    } else {
      module = new vm.SourceTextModule(await readFile(new URL(url), "utf8"), { context, identifier: url });
    }
    cache.set(url, module);
    await module.link((specifier, parent) => load(specifier.startsWith(".") ? new URL(specifier, parent.identifier).href : specifier));
    return module;
  }
  const module = await load(new URL(`../src/controllers/${name}.js`, import.meta.url).href);
  await module.evaluate();
  return module.namespace;
}

export function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
