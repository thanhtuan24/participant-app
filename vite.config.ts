import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import fs from "fs";
import path from "path";
// https://vitejs.dev/config/
export default () => {
    return defineConfig({
        root: "./src",
        base: "./",
        plugins: [
            react({
                babel: {
                    plugins: ["babel-plugin-macros"],
                },
            }),
            {
                name: "copy-app-config",
                closeBundle() {
                    const wwwDir = path.resolve(__dirname, "www");
                    const assetsDir = path.resolve(wwwDir, "assets");
                    const config = JSON.parse(
                        fs.readFileSync(
                            path.resolve(__dirname, "app-config.json"),
                            "utf-8"
                        )
                    );
                    const assets = fs.readdirSync(assetsDir);
                    config.listCSS = assets
                        .filter((f: string) => f.endsWith(".css"))
                        .map((f: string) => `assets/${f}`);
                    config.listSyncJS = assets
                        .filter((f: string) => f.endsWith(".js"))
                        .map((f: string) => `assets/${f}`);
                    fs.writeFileSync(
                        path.resolve(wwwDir, "app-config.json"),
                        JSON.stringify(config)
                    );
                },
            },
        ],
        build: {
            target: "es2020",
            outDir: path.resolve(__dirname, "www"),
            rollupOptions: {
                output: {
                    entryFileNames: "assets/[name].[hash].module.js",
                },
            },
        },
        resolve: {
            alias: {
                "@assets": path.resolve(__dirname, "src/assets"),
                "@components": path.resolve(__dirname, "src/components"),
                "@common": path.resolve(__dirname, "src/common"),
                "@constants": path.resolve(__dirname, "src/constants"),
                "@routes": path.resolve(__dirname, "src/routes"),
                "@shared": path.resolve(__dirname, "src/shared"),
                "@utils": path.resolve(__dirname, "src/utils"),
                "@pages": path.resolve(__dirname, "src/pages"),
                "@dts": path.resolve(__dirname, "src/types"),
                "@state": path.resolve(__dirname, "src/state"),
                "@service": path.resolve(__dirname, "src/service"),
                "@store": path.resolve(__dirname, "src/store"),
                "@mock": path.resolve(__dirname, "src/mock"),
            },
        },
    });
};
