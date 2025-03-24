import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import TerserPlugin from 'terser-webpack-plugin';

export default (_env, argv) => {
  const isProduction = argv.mode === 'production';
  
  // Paths
  const headersPath = resolve(import.meta.dirname, 'src/header.js');
  const outputPath = resolve(import.meta.dirname, 'dist/KG_Chat_Empowerment.js');
  
  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/main.js', // Main script file
    output: {
      path: resolve(import.meta.dirname, 'dist'),
      filename: 'KG_Chat_Empowerment.js', // Output file name
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    optimization: {
      minimize: isProduction, // Only minify in production
      minimizer: [new TerserPlugin()],
    },
    stats: 'minimal',
    plugins: [
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('AppendTampermonkeyHeader', () => {
            try {
              const header = readFileSync(headersPath, 'utf8').trim();
              const script = readFileSync(outputPath, 'utf8');
              writeFileSync(outputPath, `${header}\n\n${script}`);
            } catch (error) {
              console.error('Error appending Tampermonkey headers:', error);
            }
          });
        },
      },
    ],
  };
};