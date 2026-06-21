import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'www/src/main.js',
  output: {
    file: 'www/app.js',
    format: 'iife',
    name: 'CatHuntingGame'
  },
  plugins: [
    resolve(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        ['@babel/preset-env', {
          targets: {
            android: '5.1',
            chrome: '39'
          },
          useBuiltIns: false
        }]
      ]
    })
  ]
};
