const path = require('path');
const fs = require('fs');

// Paths
const headersPath = path.resolve(__dirname, 'src/header.js');
const outputPath = path.resolve(__dirname, 'dist/KG_Chat_Empowerment.js');

module.exports = {
  mode: 'production',
  entry: './src/main.js',  // Your main script file
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'KG_Chat_Empowerment.js', // Output script name
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('AppendTampermonkeyHeader', () => {
          try {
            // Read header content
            const header = fs.readFileSync(headersPath, 'utf8').trim();
            // Read compiled JS content
            const script = fs.readFileSync(outputPath, 'utf8');
            // Write header + script to final file
            fs.writeFileSync(outputPath, `${header}\n\n${script}`);
          } catch (error) {
            console.error('Error appending Tampermonkey headers:', error);
          }
        });
      },
    },
  ],
};
