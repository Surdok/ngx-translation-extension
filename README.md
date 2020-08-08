# ngx-translation-extension

An extension that aims to help developers generate translation strings/localize their angular projects. This extension supports Google Translation API so that the user can easily translate any string, granted that he has a Google API key at first hand.

## Features

1. Auto translation of HTML strings as shown in the gif below
![Sample translation for HTML files](https://raw.githubusercontent.com/Surdok/ngx-translation-extension/master/assets/images/sample.gif)
![Translating multiple lines of strings using multi cursor](https://raw.githubusercontent.com/Surdok/ngx-translation-extension/master/assets/images/sample2.gif)

2. Auto translate strings using a google key and automatically add them to the .JSON files

## Extension Settings

This extension contributes the following settings:

* `ngx-translation-extension.autoFileModify`: Automatically modifies transilation files that are specified in the extension settings.
* `ngx-translation-extension.languageFrom``: The source language to be translated from.
* `ngx-translation-extension.languageTo``: The target language to be translated to.
* `ngx-translation-extension.googleAPIKey``: Specify a google API key in order to add google translations to the target language. Leave empty to paste the selected text to the target translated file key as it is.

