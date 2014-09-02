/**
 * Default config for AENV.
 * @author: nanqiao.dengnq@alibaba-inc.com
 */

var tianma = require('tianma'),
	pipe = tianma.pipe;

tianma
	.createHost({ port: config.port || 81, portssl: config.portssl || 443 })
		.mount('*.aliunicorn.com', [
			pipe('tianma-unicorn@1.0.15', { source: 'loop://localhost/' }),
			(function (proxy) {
				return function (context, next) {
					if (context.request.protocol === 'https:') {
						proxy(context, next);
					} else {
						next();
					}
				};
			}(pipe.proxy({
				'loop://localhost/$1': /\/\/.*?\/([sw]img\/.*)/,
				'http://img.alibaba.com@42.156.172.43/$1': /\/\/.*?\/(img\/(?:portrait|company)\/.*)/
			})))
		])
		.mount('*.aliunicorn.com/version', [
			pipe.proxy({
				'http://style.aliunicorn.com@42.156.220.50/$1': /\/\/.*?\/(.*)/
			})
		])
		.mount('/', [
			pipe.static({ root: config.root || '../intl-style' }),
			pipe.proxy({
				'http://style.alibaba.com@42.156.172.43/$1': /\/\/.*?\/(.*)/
			}),
			//pipe.debug(),
			pipe('tianma-mark@0.9.7', { mode: 'test' }),
			pipe('tianma-hozdebug@0.9.1'),
			function (context, next) {
				var response = context.response,
					mime = [
						'application/vnd.ms-fontobject',
						'application/x-font-ttf',
						'font/opentype',
						'application/x-font-woff',
						'application/font-woff'
					];

				if (mime.indexOf(response.head('content-type')) !== -1) {
					context.response.head('access-control-allow-origin', '*');
				}

				next();
			},
			// for csrf
			function(context, next){
				var path = context.request.path;
				if(/^(\/js\/6v\/atom\/(\?\?)?atom-\w+\.js|\/js\/ae\.js|\/js\/5v\/lib\/ae\/ae\.js|\/js\/5v\/lib\/aelite\/aelite\.js)/.test(path)){
					var response = context.response;
					var source = response.body();
					var csrf = "(function(){if(!window.WebSocket||window.isCsrfLoaded){return}window.isCsrfLoaded=true;function reportAjax(arrList){try{var socket=new WebSocket('ws://starfish.alif2e.com:3000/');socket.onopen=function(){var strObject=JSON.stringify({type:'ajaxlist',data:arrList});socket.send(strObject);socket.close()}}catch(e){}}var arrAjaxList=[];var isReady=false;seajs.use('$',function($){$.ajaxPrefilter('json jsonp',function(s,originalSettings,jqXHR){var match=s.url.match(/([^\\?]+)(?:\\?(.+))?/);var target=match[1]||'';var search=match[2]||'';var jsonp=s.converters['script json']?1:0;match=s.url.match(/(?:\\?|&)_csrf_token_=([^&]+)/);var token=match&&match[1]||'';var ajax={location:location.href,target:target,search:search,jsonp:jsonp,token:token};if(isReady){reportAjax([ajax])}else{arrAjaxList.push(ajax)}});$(function(){isReady=true;if(arrAjaxList.length>0){reportAjax(arrAjaxList)}})})})();";
					response.clear().write(source+'\r\n'+csrf);
				}
				next();
			}
		])
		.start();
