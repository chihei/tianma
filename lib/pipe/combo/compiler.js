/**
 * Tianma - Pipe - Combo - Compiler
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */
var depsParser = require('./dependenciesParser'),
	path = require('path');

var PATTERN_IMAGE_URL = /url\s*\(\s*["']?(.*?\.(?:png|gif|jpg|jpeg))["']?\s*\)/gim,

	/**
	 * Compile file.
	 * @param file {Object}
	 * @param callback {Function}
	 */
	compile = function (file, callback) {
		var extname = path.extname(file.pathname);

		if (extname === '.js') {
			compileJS(file, callback);
		} else if (extname === '.css') {
			compileCSS(file, callback);
		} else {
			callback(null, file);
		}
	},

	/**
	 * Compile css file.
	 * @param file {Object}
	 * @param callback {Function}
	 */
	compileCSS = function (file, callback) {
		file.data = file.data.replace(PATTERN_IMAGE_URL, function ($0, $1) {
			if ($1.indexOf('http') !== 0) {
				return 'url(http://img.alibaba.com/' + $1 + ')';
			} else {
				return $0;
			}
		});

		callback(null, depsParser.parse(file));
	},

	/**
	 * Compile js file.
	 * @param file {Object}
	 * @param callback {Function}
	 */
	compileJS = function (file, callback) {
		callback(null, depsParser.parse(file));
	};

exports.compile = compile;