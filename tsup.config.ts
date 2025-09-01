import { defineConfig } from 'tsup';

export default defineConfig({
    clean: true,
    dts: true,
    entry: ['src/lib/index.ts', 'src/bin/check.ts'],
    format: ['esm', 'cjs'],
    minify: true,
    shims: true,
    sourcemap: true,
});
