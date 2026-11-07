import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // O celular acessa o servidor de desenvolvimento usando o IP da rede local.
  allowedDevOrigins: ["192.168.18.2"],
  turbopack: {
    root: path.resolve(appDirectory, "../.."),
  },
};

export default nextConfig;
