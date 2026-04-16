import { defineConfig } from 'tsdown';

export default defineConfig({
    dts: true,
    entry: ['src/lib/index.ts', 'src/bin/check.ts'],
    format: ['esm', 'cjs'],
    minify: true,
    shims: true,
    sourcemap: true,
});
