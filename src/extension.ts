// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs = require('fs');
import * as copypaste from 'copy-paste';
import jsonfile = require("jsonfile");

const settings: Settings = (vscode.workspace.getConfiguration("ngx-translation-extension") as any);


/**
 * Creates the translation assets if they doesn't exist.
 * @param dir The directory where the assets should be.
 */
function createTranslationAssets(dir: string) {
	if (!fs.existsSync(dir)) {
		console.log('Creating translation folder.');
		fs.mkdirSync(dir);
	}

	const fromPath = dir + settings.languageFrom + '.json';
	if (!fs.existsSync(fromPath)) {
		console.log('Creating the source language to be translated from.');
		fs.writeFileSync(fromPath, JSON.stringify({}));
	}

	const toPath = dir + settings.languageTo + '.json';
	if (!fs.existsSync(toPath)) {
		console.log('Creating the source language to be translated to.');
		fs.writeFileSync(toPath, JSON.stringify({}));
	}
}

function getNumberofLine(sourceString: string, string: string): number {
	const pos = sourceString.indexOf(string);
	const tempString = sourceString.substring(0, pos);
	return tempString.split("\n").length;
}

/**
 * Calls the Google api in order to translate an array of 
 * strings to append them later on to the target translated language file.
 * @param arr The array where keys that represents selected strings
 */
function addGoogleTranslations(arr: {
	key: string;
	fromString: string;
}[]) {

	const fileTo = vscode.window.activeTextEditor?.document.uri.fsPath.split("src")[0] + "src/assets/i18n/" + settings.languageTo + ".json";
	const toObj = jsonfile.readFileSync(fileTo);
	let googleTranslate = require("google-translate")(settings.googleAPIKey);

	googleTranslate.translate(arr.map(e => e.fromString), settings.languageTo, (err: any, translation: any) => {
		if (err) {
			const apiErrorMessage =
				err &&
				err.body &&
				JSON.parse(err.body) &&
				JSON.parse(err.body).error &&
				JSON.parse(err.body).error.message;
			return vscode.window.showErrorMessage(apiErrorMessage);
		}
		if (typeof translation === 'object' && arr.length === 1) {
			const translatedText = translation.translatedText;
			toObj[arr[0].key!] = translatedText;
		} else {
			const translations: string[] = translation.map((e: any) => e.translatedText);
			arr.forEach((v, i) => {
				toObj[v.key!] = translations[i];
			});
		}
		jsonfile.writeFileSync(fileTo, toObj);

		vscode.window.showInformationMessage("Text translated successfully!");
	}
	);
}

export function activate(context: vscode.ExtensionContext) {

	// Registering Commands
	const commands: vscode.Disposable[] = [
		vscode.commands.registerCommand('ngx-translation-extension.translateHTML', () => translate()),
		vscode.commands.registerCommand('ngx-translation-extension.translateTS', () => translate(true)),
	];

	commands.forEach(v => context.subscriptions.push(v));

}


async function translate(tsfile = false) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showWarningMessage("Select text to translate");
		return;
	}
	const jsonDirectory = editor.document.uri.fsPath.split("src")[0] + "src/assets/i18n/";
	let googleTranslate = require("google-translate")(settings.googleAPIKey);

	createTranslationAssets(jsonDirectory);
	await editor.edit(async (builder) => {

		const constructedArray: {
			key: string;
			fromString: string;
		}[] = [];
		const fileFrom = jsonDirectory + settings.languageFrom + ".json";
		const fileTo = jsonDirectory + settings.languageTo + ".json";

		editor.selections.forEach(async selection => {
			const selectedText = editor.document.getText(selection);
			const key = selectedText.toUpperCase().replace(/ /g, "_").replace(/\W*/g, "");


			if (settings.autoFileModify) {
				// Find if object already in the file, and dont add to the file if key already there
				const obj = jsonfile.readFileSync(fileFrom);
				if (!Object.keys(obj).includes(key!)) {
					obj[key!] = selectedText;
					jsonfile.writeFileSync(fileFrom, obj);
					constructedArray.push({
						key,
						fromString: selectedText
					});
				} else {
					vscode.window.showInformationMessage(
						"Key was already found! No files was modified during the process."
					);
				}
				console.log(editor.document.uri.fsPath);

				const pathSeperator = editor.document.uri.fsPath.includes('/') ? '/' : '\\';
				const temp = editor.document.fileName.split(pathSeperator);
				const temp2 = temp[temp.length - 1].split('.');
				const fileExtension = temp2[temp2.length - 1];


				// if (fileExtension === 'html') {
				let translation = '';
				if (tsfile) {
					translation = `${key}`;
				} else {
					translation = `{{'${key}' | translate }}`;
				}

				builder.replace(selection, translation);
				// }

				// else if (fileExtension === 'ts') {
				// 	const docText = editor.document.getText();

				// 	// Case where ngOnInit is not found
				// 	if (docText.indexOf('implements OnInit') === -1) {
				// 		const newDocText = docText.replace(/(export class \w+Component )/, '$&implements OnInit');

				// 		builder.replace(new vscode.Range(0, 0, editor.document.lineCount + 1, 0), newDocText);
				// 	}
				// }


			} else {
				const listStrings = editor.selections.map(e => editor.document.getText(e).toUpperCase().replace(/ /g, "_").replace(/\W*/g, "")).join('\n');

				copypaste.copy(listStrings);
				vscode.window.showInformationMessage(
					`No files were modified.
			Key(s) copied to clipboard.
			Please enable auto file modification to automatically insert translations to json files.`
				);
				return false;
			}
		});

		if (settings.googleAPIKey !== "") {
			addGoogleTranslations(constructedArray);
		} else {
			const toObj = jsonfile.readFileSync(fileTo);

			constructedArray.forEach(ele => {
				toObj[ele.key!] = ele.fromString;
				jsonfile.writeFileSync(fileTo, toObj);
			});

			vscode.window.showInformationMessage("Google Key was not set. Added un-translated key-values.");
		}
	}).then((e) => {

	});


};

// this method is called when your extension is deactivated
export function deactivate() { }

interface Settings {
	autoFileModify: boolean;
	languageFrom: string;
	languageTo: string;
	googleAPIKey: string;
}