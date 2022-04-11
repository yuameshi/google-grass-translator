const translateText = process.argv[2];
const targetLang = process.argv[3] || 'zh-CN';
const HttpsProxyAgent = require('https-proxy-agent');
const fs = require('fs');
const fetch = require('node-fetch');
if (translateText==undefined) {
	console.log('Error: No text to translate.');
	console.log('Usage: "Text to translate" [Target Language]');
	fs.appendFileSync('translate.log', `[${new Date().toISOString()}][Init] Error: No text to translate.\n`);
	process.exit(1);
}
console.log('Translating: ', translateText);
fs.appendFileSync('translate.log', `[${new Date().toISOString()}][Init] Source: ${translateText}\n`);
console.log('Target Lang: ', targetLang);
fs.appendFileSync('translate.log', `[${new Date().toISOString()}][Init] Target Language: ${targetLang}\n`);
function translate(text, targetLang) {
	return new Promise(function (resolve) {
		const translateBody = JSON.stringify([
			[
				[
					'MkEWBc',
					JSON.stringify([[text, 'auto', targetLang, true], [null]]),
					null,
					'generic',
				],
			],
		]);
		// console.log(translateBody);
		fetch(
			'https://translate.google.cn/_/TranslateWebserverUi/data/batchexecute?rpcids=MkEWBc&source-path=%2F&f.sid=-2684615221053975002&bl=boq_translate-webserver_20220406.13_p0&hl=zh-CN&soc-app=1&soc-platform=1&soc-device=1&_reqid=682466&rt=c',
			{
				headers: require('./headers.js').headers,
				referrer: 'https://translate.google.cn/',
				referrerPolicy: 'origin',
				agent: require('./proxy.js').proxy
					? new HttpsProxyAgent(require('./proxy').proxy)
					: undefined,
				body: 'f.req=' + encodeURI(translateBody),
				method: 'POST',
				mode: 'cors',
				credentials: 'include',
			}
		).then((res) => {
			res.text().then((text) => {
				const lines = text.split('\n');
				lines.forEach((line) => {
					try {
						// console.log(line);
						const json = JSON.parse(line)[0][2];
						const translations = JSON.parse(json)[1][0][0][5];
						let result='';
						translations.forEach((translation) => {
							result=result+translation[0];
						});
						resolve(result);
					} catch (error) {
						undefined;
						//do nothing
					}
				});
				// const result=JSON.parse(JSON.parse(lines[3])[0])[1][0][0][5][0][0];
				// console.log(result);
				// resolve(json[0][0][0]);
			});
		});
		// fetch(
		// 	`https://translate.google.com/translate_a/single?client=at&sl=auto&tl=${targetLang}&dt=t&q=${text}`,
		// 	{
		// 		headers: require('./headers.js').headers,
		// 		agent: require('./proxy.js').proxy
		// 			? new HttpsProxyAgent(require('./proxy').proxy)
		// 			: undefined,
		// 		referrer: 'https://translate.google.com/',
		// 		referrerPolicy: 'origin',
		// 		body: null,
		// 		method: 'GET',
		// 		mode: 'cors',
		// 		credentials: 'include',
		// 	}
		// ).then((res) => {
		// 	res.json().then((json) => {
		// 		resolve(json[0][0][0]);
		// 	});
		// });
	});
}
function parseGoogleTranslateCallback(object) {
	return JSON.parse(JSON.parse(object)[0][2])[1][0][0][5][0][0];
}
const langs = require('./langs.js').langs;
let outputText = translateText;
for (let i = 0; i < langs.length; i++) {
	setTimeout(() => {
		translate(outputText, langs[i]).then((res) => {
			fs.appendFileSync('translate.log', `[${new Date().toISOString()}][Translate] [Loop:${i}]	[To ${langs[i]}]	Result: ${res}\n`);
			outputText = res;
			console.log(outputText);
		});
	}, 5000 * i);
}
setTimeout(() => {
	translate(outputText, targetLang).then((res) => {
		fs.appendFileSync('translate.log', `[${new Date().toISOString()}][Translate] [Ending]	[To ${targetLang}]	Result: ${res}\n`);
		outputText = res;
		console.log(outputText);
	});
}, 5000 * (langs.length + 1));
