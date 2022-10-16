const translateText = process.argv[2];
const targetLang = process.argv[3] || 'zh-CN';
import HttpsProxyAgent from 'https-proxy-agent'
import fs from 'fs';
import { headers } from './headers.js'
import { langs } from './langs.js';
import { proxy } from './proxy.js';
import fetch from 'node-fetch';
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
	if (text.length>5000) {
		console.log('Error: Text too long.');
		fs.appendFileSync('translate.log', `[${new Date().toISOString()}][Translate] [Loop:${i}]	[To ${langs[i]}]	Error: Text too long.\n`);
		process.exit(1);
	}
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
// 		fetch(
// 			'https://translate.google.com/_/TranslateWebserverUi/data/batchexecute?rpcids=MkEWBc&source-path=%2F&f.sid=-2684615221053975002&bl=boq_translate-webserver_20220406.13_p0&hl=zh-CN&soc-app=1&soc-platform=1&soc-device=1&_reqid=682466&rt=c',
// 			{
// 				headers: require('./headers.js').headers,
// 				referrer: 'https://translate.google.com/',
// 				referrerPolicy: 'origin',
// 				agent: require('./proxy.js').proxy
// 					? new HttpsProxyAgent(require('./proxy').proxy)
// 					: undefined,
// 				body: 'f.req=' + encodeURI(translateBody),
// 				method: 'POST',
// 				mode: 'cors',
// 				credentials: 'include',
// 			}
// 		).then((res) => {
// 			res.text().then((text) => {
// 				const lines = text.split('\n');
// 				lines.forEach((line) => {
// 					try {
// 						// console.log(line);
// 						const json = JSON.parse(line)[0][2];
// 						const translations = JSON.parse(json)[1][0][0][5];
// 						let result='';
// 						translations.forEach((translation) => {
// 							result=result+translation[0];
// 						});
// 						resolve(result);
// 					} catch (error) {
// 						undefined;
// 						//do nothing
// 					}
// 				});
// 				// const result=JSON.parse(JSON.parse(lines[3])[0])[1][0][0][5][0][0];
// 				// console.log(result);
// 				// resolve(json[0][0][0]);
// 			});
// 		});
		fetch(
			`https://translate.google.com/translate_a/single?client=at&sl=auto&tl=${targetLang}&dt=t&q=${text}`,
			{
				headers: headers,
				agent: proxy
					? new HttpsProxyAgent(proxy)
					: undefined,
				referrer: 'https://translate.google.com/',
				referrerPolicy: 'origin',
				body: null,
				method: 'GET',
				mode: 'cors',
				credentials: 'include',
			}
		).then((res) => {
			res.json().then((json) => {
				resolve(json[0][0][0]);
			});
		});
	});
}
let outputText = translateText;

// 无延迟版
// let loop = 0;
// langs.forEach(async (lang) => {
// 	let from = outputText;
// 	outputText = await translate(outputText, lang);
// 	fs.appendFileSync('translate.log', `[${new Date().toISOString()}][Translate] [Loop:${loop}]	[To ${lang}]	Result: ${outputText}	Source: ${from}\n`);
// 	console.log(outputText);
// 	loop++;
// });
// let endingInterval = setInterval(() => {
// 	if (loop == langs.length) {
// 		translate(outputText, targetLang).then((res) => {
// 			fs.appendFileSync('translate.log', `[${new Date().toISOString()}][Translate] [Ending]	[To ${targetLang}]	Result: ${res}\n`);
// 			outputText = res;
// 			console.log(outputText);
// 			clearInterval(endingInterval);
// 		});
// 	}
// }, 1000);

// 每次延迟5s
for (let i = 0; i < langs.length; i++) {
	setTimeout(() => {
		translate(outputText, langs[i]).then((res) => {
			fs.appendFileSync('translate.log', `[${new Date().toISOString()}][Translate] [Loop:${i}]	[To ${langs[i]}]	Result: ${res}	Source: ${outputText}\n`);
			outputText = res;
			console.log(outputText);
		});
	}, 1000 * i);
}
setTimeout(() => {
	translate(outputText, targetLang).then((res) => {
		fs.appendFileSync('translate.log', `[${new Date().toISOString()}][Translate] [Ending]	[To ${targetLang}]	Result: ${res}	Source: ${outputText}\n`);
		outputText = res;
		console.log(outputText);
	});
}, 1000 * (langs.length + 1));
