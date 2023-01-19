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

	const targetLanguages = settings.languageTo.split(',');

	targetLanguages.forEach(language => {
		const toPath = dir + language + '.json';
		if (!fs.existsSync(toPath)) {
			console.log('Creating the source language to be translated to : ' + toPath);
			fs.writeFileSync(toPath, JSON.stringify({}));
		}
	});
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

	const targetLanguages = settings.languageTo.split(',');

	targetLanguages.forEach(target => {

		let WorkingFolder = '';

		if (vscode.workspace.workspaceFolders) {
			WorkingFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
		} else {
			vscode.window.showWarningMessage("Couldn't find opened workspace directory.");
			return;
		}

		const jsonDirectory = WorkingFolder + '\\' + settings.JSONDirectory;

		const fileTo = jsonDirectory + target + ".json";
		const toObj = jsonfile.readFileSync(fileTo);
		let googleTranslate = require("google-translate")(settings.googleAPIKey);

		googleTranslate.translate(arr.map(e => e.fromString), target, (err: any, translation: any) => {
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
			jsonfile.writeFileSync(fileTo, toObj, { spaces: 2 });

			vscode.window.showInformationMessage("Text translated successfully!");
		}
		);
	});
}

export function activate(context: vscode.ExtensionContext) {

	// Registering Commands
	const commands: vscode.Disposable[] = [
		vscode.commands.registerCommand('ngx-translation-extension.translateHTML', () => translate()),
		vscode.commands.registerCommand('ngx-translation-extension.translateTS', () => translate(true)),
		vscode.commands.registerCommand('ngx-translation-extension.translateWithFormats', () => translate(false, true)),
		vscode.commands.registerCommand('ngx-translation-extension.GetTranslationKey', () => GetTranslationKey()),
	];

	commands.forEach(v => context.subscriptions.push(v));

}


async function translate(tsfile = false, customFormat = false) {

	let chosenFormat: string = '';
	if (customFormat) {

		let items: vscode.QuickPickItem[] = settings.Formats.map(str => ({
			label: str,
		}));

		const selectionQuickPick = await vscode.window.showQuickPick(items)
		if (selectionQuickPick) {

			chosenFormat = selectionQuickPick.label;
		} else {
			vscode.window.showInformationMessage(
				`No format was selected. Please select a format for translation.`
			);
		}
	}

	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showWarningMessage("Select text to translate");
		return;
	}

	let WorkingFolder = '';

	if (vscode.workspace.workspaceFolders) {
		WorkingFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
	} else {
		vscode.window.showWarningMessage("Couldn't find opened workspace directory.");
		return;
	}

	// TODO: Handle linux pathing..

	const jsonDirectory = WorkingFolder + '\\' + settings.JSONDirectory;

	createTranslationAssets(jsonDirectory);

	const constructedArray: {
		key: string;
		fromString: string;
	}[] = [];
	const fileFrom = jsonDirectory + settings.languageFrom + ".json";
	editor.edit((builder) => {

		editor.selections.forEach(async selection => {
			const selectedText = editor.document.getText(selection);
			const key = selectedText.toUpperCase().replace(/ /g, "_").replace(/\W*/g, "");


			if (settings.autoFileModify) {
				// Find if object already in the file, and dont add to the file if key already there
				const obj = jsonfile.readFileSync(fileFrom);
				if (!Object.keys(obj).includes(key!)) {
					obj[key!] = selectedText;
					jsonfile.writeFileSync(fileFrom, obj, { spaces: 2 });
					constructedArray.push({
						key,
						fromString: selectedText
					});
				} else {
					vscode.window.showInformationMessage(
						"Key was already found! No files was modified during the process."
					);
				}

				// TODO: Good idea for switching between different os pathings..
				// const pathSeperator = editor.document.uri.fsPath.includes('/') ? '/' : '\\';

				let translation = '';
				if (tsfile) {
					translation = `${key}`;
				} else {
					if (customFormat) {
						translation = chosenFormat.replace('$key', key);
					} else {
						translation = settings.TranslationWrappingHTML.replace('$key', key);
					}
				}
				// if (!customFormat) {
				builder.replace(selection, translation);


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

			if (settings.googleAPIKey !== "") {
				addGoogleTranslations(constructedArray);
			} else {

				const targetLanguages = settings.languageTo.split(',');

				targetLanguages.forEach(target => {
					const fileTo = jsonDirectory + target + ".json";
					const toObj = jsonfile.readFileSync(fileTo);

					constructedArray.forEach(ele => {
						toObj[ele.key!] = ele.fromString;
						jsonfile.writeFileSync(fileTo, toObj, { spaces: 2 });
					});
				});

				vscode.window.showInformationMessage("Google Key was not set. Added un-translated key-values.");
			}
		})
	}).then(() => {

	});

};

// this method is called when your extension is deactivated
export function deactivate() { }

interface Settings {
	autoFileModify: boolean;
	languageFrom: string;
	languageTo: string;
	googleAPIKey: string;
	JSONDirectory: string;
	TranslationWrappingHTML: string;
	Formats: string[];
}

function GetTranslationKey() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showWarningMessage("Select text to translate");
		return;
	}
	let WorkingFolder = '';

	if (vscode.workspace.workspaceFolders) {
		WorkingFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
	} else {
		vscode.window.showWarningMessage("Couldn't find opened workspace directory.");
		return;
	}
	const jsonDirectory = WorkingFolder + '\\' + settings.JSONDirectory;

	const fileFrom = jsonDirectory + settings.languageFrom + ".json";

	const obj = jsonfile.readFileSync(fileFrom);


	let items: vscode.QuickPickItem[] = Object.entries(obj).map(([key, value]) => ({
		label: key,
		description: String(value),
	}));

	vscode.window.showQuickPick(items).then(selectionQuickPick => {
		if (selectionQuickPick) {

			editor.edit((builder) => {

				builder.replace(editor.selection, selectionQuickPick.label);
			}).then(() => {

			});
		}
	});
}
