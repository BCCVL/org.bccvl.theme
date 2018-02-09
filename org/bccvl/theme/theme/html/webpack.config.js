const webpack = require('webpack');
const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: {
    'bccvl-visualiser-compare': './js/bccvl-visualiser-compare.js',
    'bccvl-visualiser-compare-graphs': './js/bccvl-visualiser-compare-graphs.js',
    'bccvl-visualiser-overlay': './js/bccvl-visualiser-overlay.js',
    'dashboard': './js/dashboard.js',
    'dataset-collections': './js/dataset-collections.js',
    'dataset-import': './js/dataset-import.js',
    'dataset-list': './js/dataset-list.js',
    'dataset-upload': './js/dataset-upload.js',
    'experiment-list': './js/experiment-list.js',
    'experiment-results': './js/experiment-results.js',
    'feedback': './js/feedback.js',
    'homepage': './js/homepage.js',
    'login': './js/login.js',
    'new-experiment-biodiverse': './js/new-experiment-biodiverse.js',
    'new-experiment-ensemble': './js/new-experiment-ensemble.js',
    'new-experiment-mme': './js/new-experiment-mme.js',
    'new-experiment-msdm': './js/new-experiment-msdm.js',
    'new-experiment-projection': './js/new-experiment-projection.js',
    'new-experiment-sdm': './js/new-experiment-sdm.js',
    'new-experiment-speciestrait': './js/new-experiment-speciestrait.js',
    'pasword-reset': './js/password-reset.js',
    'search': './js/search.js',
    'training': './js/training.js',
    'youtube': './js/youtube.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },

  // external dependencies ... webpack won't try to bulid them into the js files,
  // but assumes that external deps are available at runtime.
  // TODO: figure out how this config option works ... will webpack issue a require cal in case we define
  //       external dep as amd?, will it check global namespace for variable to decide whether lib needs to be loaded?
  externals: {
     'jquery': 'jQuery'
  },

  resolve: {
    // options for resolving module requests
    // (does not apply to resolving to loaders)
    modules: [
      "node_modules",
      "js/lib",
      "lib/d3",
      "lib/html2canvas",
      "lib/jquery-tablesorter",
      "lib/ol3/layerswitcher",
      "lib/proj4",
      "lib/selectize",
      "lib/zip"
      //"lib",
      //path.resolve(__dirname, "app")
    ],
    alias: {
      'jquery-form$': path.resolve(__dirname, 'lib/jquery-form/jquery.form.min.js'),
      'jquery-validation$': path.resolve(__dirname, 'lib/jquery-validate/jquery.validate.js'),
      'jquery-xmlrpc$': path.resolve(__dirname, 'lib/jquery-xmlrpc/jquery.xmlrpc.js'),
      'openlayers': path.resolve(__dirname, 'lib/ol3/ol.js'),
      'prismjs': path.resolve(__dirname, 'lib/prism/prism.js'),
      'shpjs': path.resolve(__dirname, 'lib/shpjs/shp.js'),
      'turf': path.resolve(__dirname, 'lib/turfjs/turf.min.js')
    }
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common-chunks',
      filename: 'common-chunks.js',
      minChunks: 2
      //minChunks: 10
    }),
    new webpack.SourceMapDevToolPlugin({
      filename: '[name].js.map'
    }),
    new UglifyJSPlugin()
  ]
};
