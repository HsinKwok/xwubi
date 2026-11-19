import { existsSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const root = process.cwd();

/** 本地开发时让 /admin/* 深链接与生产一致地落到管理台入口 */
const adminShellFallback: Plugin = {
  name: 'admin-shell-fallback',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const path = (req.url ?? '').split('?')[0];
      if ((path === '/admin' || path.startsWith('/admin/')) && !/\.[a-z0-9]+$/i.test(path)) {
        req.url = '/admin.html';
      }
      next();
    });
  },
};

/** 站点外壳输出为 site.html：根路径不再被静态资源直接命中，统一由 Worker 注入头部/页脚 */
const siteShellRename: Plugin = {
  name: 'site-shell-rename',
  apply: 'build',
  writeBundle(options) {
    const dir = options.dir ?? resolve(root, 'dist');
    const from = resolve(dir, 'index.html');
    if (existsSync(from)) renameSync(from, resolve(dir, 'site.html'));
  },
};

export default defineConfig({
  plugins: [react(), adminShellFallback, siteShellRename],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    target: 'es2020',
    reportCompressedSize: false,
    rollupOptions: {
      input: {
        site: resolve(root, 'index.html'),
        admin: resolve(root, 'admin.html'),
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: false,
      },
    },
  },
});
