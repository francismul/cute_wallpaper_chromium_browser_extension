import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, existsSync } from 'fs';

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: {
    'background': 'src/background.ts',
    'newTab': 'src/content/newTab.ts',
    'options': 'src/options.ts',
  },
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  minify: !isWatch,
  splitting: false,
};

async function build() {
  try {
    // Create dist directory
    mkdirSync('dist', { recursive: true });
    
    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('👀 Watching for changes...');
    } else {
      await esbuild.build(buildOptions);
      console.log('✅ Build complete!');
    }

    // Copy static files
    cpSync('src/manifest.json', 'dist/manifest.json');
    cpSync('src/newTab.html', 'dist/newTab.html', { force: true });
    cpSync('src/options.html', 'dist/options.html', { force: true });
    
    // Copy icons if they exist
    if (existsSync('src/icons')) {
      cpSync('src/icons', 'dist/icons', { recursive: true, force: true });
      console.log('📋 Static files and icons copied');
    } else {
      console.log('📋 Static files copied (⚠️  icons folder not found - extension will need icons to load)');
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
