const { override, fixBabelImports, addLessLoader,addWebpackPlugin } = require('customize-cra');
const CompressionPlugin = require('compression-webpack-plugin');
const AnalyzerBundle = require('webpack-bundle-analyzer');
const paths = require('react-scripts/config/paths');
module.exports = override(
    // add webpack-ant-icon-loader
	(config) => {
	    //单独将icon文件提出
		config.module.rules.push({
		  loader: 'webpack-ant-icon-loader',
		  enforce: 'pre',
		  include: [
			require.resolve('@ant-design/icons/lib/dist')
		  ]
        });
        let plugins = [
        	//压缩生成gzip
            new CompressionPlugin({
                compressionOptions: {
                    numiterations: 15,
                },
                test: /\.js(\?.*)?$/i,
                algorithm: 'gzip',
            }),
            //分析项目生成文件大小
            // new AnalyzerBundle.BundleAnalyzerPlugin({
            //     analyzerMode: 'static',
            //     defaultSizes: 'gzip',
            //     analyzerPort: 8888
            // })
        ];
        config.plugins = [...config.plugins, ...plugins];
		return config;
	},
    fixBabelImports('import', {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true,
    }),
    addLessLoader({
        javascriptEnabled: true,
        modifyVars: { '@primary-color': '#3C78FF' }
    }),
    
    // addWebpackPlugin(new CompressionPlugin({
    //     compressionOptions: {
    //         numiterations: 15,
    //     },
    //     test: /\.js(\?.*)?$/i,
    //     algorithm: 'gzip',
    // }))
);