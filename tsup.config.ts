import { defineConfig } from 'tsup';

export default defineConfig({
    clean: true,
    entry: [
        'src/lib/index.ts',
        'src/bin/check.ts'
    ],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    shims: true,
    minify: true
});
