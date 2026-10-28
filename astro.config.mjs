// @ts-check
import { defineConfig } from 'astro/config';

// SITE / BASE는 GitHub Actions 배포 시 자동으로 채워집니다. (프로젝트 사이트라 BASE = '/ohsolgil')
export default defineConfig({
  site: process.env.SITE || 'http://localhost:4321',
  base: process.env.BASE || '/',
  trailingSlash: 'ignore',
});
