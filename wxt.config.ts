import { defineConfig } from 'wxt';
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'ChatGPT播客助手 - 一键下载对话所有语音',
    permissions: ["webRequest", "storage", "downloads", "tabs"]
  }
});
