# ngx-translation-extension

An extension that aims to help developers generate translation strings/localize their angular projects. This extension supports Google Translation API so that the user can easily translate any string, granted that he has a Google API key at first hand.

## Features

1. Auto translation of HTML strings as shown in the gif below
   ![Sample translation for HTML files](https://raw.githubusercontent.com/Surdok/ngx-translation-extension/master/assets/images/sample.gif)
   ![Translating multiple lines of strings using multi cursor](https://raw.githubusercontent.com/Surdok/ngx-translation-extension/master/assets/images/sample2.gif)

2. Auto translate strings using a google key and automatically add them to the .JSON files

## Extension Settings

This extension contributes the following settings:

- `ngx-translation-extension.TranslationWrappingHTML`: Surrounds stored key of translated string by pipe/statement etc.. $key is required for this option to work. Example : `{{'$key' | translate }}`
- `ngx-translation-extension.JSONDirectory`: Path where to find the translation JSON Files. Example : `src/assets/i18n/`
- `ngx-translation-extension.autoFileModify`: Automatically modifies transilation files that are specified in the extension settings.
- `ngx-translation-extension.languageFrom`: The source language to be translated from.
- `ngx-translation-extension.GetTranslationKey`: Get Translation Key : Pastes a key from the JSON file (uses the 'from' targeted json file)
- `ngx-translation-extension.Formats`: Pre-defined multiple list of formats to be used for different cases (e.g html pages, ts or js script files, etcc..) Example : `{{'$key' | translate }}`
- `ngx-translation-extension.languageTo`: The target language to be translated to (Now supports multiple targeted languages by passing `ar,es,fr`).
- `ngx-translation-extension.googleAPIKey`: Specify a google API key in order to add google translations to the target language. Leave empty to paste the selected text to the target translated file key as it is.

## Ideas :

- Make a presets list so that the user is able to select any preset he defines in the settings
- Give out an option to search and paste the keys that are read in the json file
