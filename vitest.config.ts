import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true, // Permet d'utiliser `describe`, `it`, `expect` sans les importer
    environment: 'jsdom', // Simule un environnement de navigateur pour les tests
    setupFiles: './setupTests.ts', // Fichier exécuté avant chaque suite de tests
    coverage: {
        reporter: ['text', 'json', 'html'],
        provider: 'v8',
    },
  },
}));