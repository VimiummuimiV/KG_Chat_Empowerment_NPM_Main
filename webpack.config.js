const path = require('path');
const fs = require('fs');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  // Paths
  const headersPath = path.resolve(__dirname, 'src/header.js');
  const outputPath = path.resolve(__dirname, 'dist/KG_Chat_Empowerment.js');

  return {
    mode: isProduction ? 'production' : 'development',

    entry: './src/main.js', // Main script file
    output: {
      path: path.resolve(__dirname, 'dist'),
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
    plugins: [
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('AppendTampermonkeyHeader', () => {
            try {
              const header = fs.readFileSync(headersPath, 'utf8').trim();
              const script = fs.readFileSync(outputPath, 'utf8');
              fs.writeFileSync(outputPath, `${header}\n\n${script}`);
            } catch (error) {
              console.error('Error appending Tampermonkey headers:', error);
            }
          });
        },
      },
    ],
  };
};
