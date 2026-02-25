// eslint-disable-next-line @typescript-eslint/ban-ts-comment

import { monaco } from "./monacoLite";
import { chuck_modules, chuck_libraries } from "./chuck-modules";
import ckdocJSON from "./ckdoc.json";

// Documentation Type for ckdoc
interface docType {
    title: string;
    description: string;
    constructors: string[];
    functions: string[];
    examples: string[];
    link: string;
}
const ckdoc: { [key: string]: docType } = ckdocJSON;

// Register a new language for Monaco
monaco.languages.register({ id: "chuck" });

// Register a tokens provider for the language
monaco.languages.setMonarchTokensProvider("chuck", {
    // Set defaultToken to invalid to see what you do not tokenize yet
    // defaultToken: 'invalid',

    keywords: [
        "if",
        "else",
        "while",
        "until",
        "for",
        "repeat",
        "break",
        "continue",
        "return",
        "switch",
        "class",
        "extends",
        "public",
        "static",
        "pure",
        "this",
        "super",
        "interface",
        "implements",
        "protected",
        "private",
        "function",
        "fun",
        "spork",
        "new",
        "const",
        "global",
        "now",
        "true",
        "false",
        "maybe",
        "null",
        "NULL",
        "me",
        "pi",
        "samp",
        "ms",
        "second",
        "minute",
        "hour",
        "day",
        "week",
        "eon",
        "dac",
        "adc",
        "blackhole",
        "bunghole",
    ],

    typeKeywords: [
        "int",
        "float",
        "time",
        "dur",
        "void",
        "vec3",
        "vec4",
        "complex",
        "polar",
        "string",
    ],

    library: ["Object", "Event", "Shred", "Math", "Machine", "Std"],

    operators: [
        "++",
        "--",
        ":",
        "+",
        "-",
        "*",
        "/",
        "%",
        "::",
        "==",
        "!=",
        "<",
        ">",
        "<=",
        ">=",
        "&&",
        "||",
        "&",
        "|",
        "^",
        ">>",
        "<<",
        "=",
        "?",
        "!",
        "~",
        "<<<",
        ">>>",
        "=>",
        "!=>",
        "=^",
        "=v",
        "@=>",
        "+=>",
        "-=>",
        "*=>",
        "/=>",
        "&=>",
        "|=>",
        "^=>",
        ">>=>",
        "<<=>",
        "%=>",
        "@",
        "@@",
        "->",
        "<-",
    ],

    ugens: chuck_modules,

    // We include these common regular expressions
    // eslint-disable-next-line no-useless-escape
    symbols: /[=><!~?:&|+\-*\/^%]+/,

    // C# style strings
    escapes:
        /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

    // The main tokenizer for our languages
    tokenizer: {
        root: [
            // Libraries
            [
                new RegExp(`(?:${chuck_libraries.join("|")})`),
                {
                    cases: {
                        "@library": "library",
                    },
                },
            ],

            // identifiers and keywords
            [
                /[a-z_$][\w$]*/,
                {
                    cases: {
                        "@typeKeywords": "keyword",
                        "@keywords": "keyword",
                        "@default": "identifier",
                    },
                },
            ],
            [/[A-Z][\w$]*/, "type.identifier"], // to show class names nicely

            // whitespace
            { include: "@whitespace" },

            // delimiters and operators
            [/[{}()[\]]/, "@brackets"],
            [/[<>](?!@symbols)/, "@brackets"],
            [
                /@symbols/,
                {
                    cases: {
                        "@operators": "operator",
                        "@default": "",
                    },
                },
            ],

            // @ annotations.
            // As an example, we emit a debugging log message on these tokens.
            // Note: message are supressed during the first load -- change some lines to see them.
            [/@\s*[a-zA-Z_$][\w$]*/, { token: "annotation" }],

            // numbers
            [/\d*\.\d+([eE][-+]?\d+)?/, "number.float"],
            [/0[xX][0-9a-fA-F]+/, "number.hex"],
            [/\d+/, "number"],

            // delimiter: after number because of .\d floats
            [/[;,.]/, "delimiter"],

            // strings
            [/"([^"\\]|\\.)*$/, "string.invalid"], // non-teminated string
            [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],

            // characters
            [/'[^\\']'/, "string"],
            [/(')(@escapes)(')/, ["string", "string.escape", "string"]],
            [/'/, "string.invalid"],
        ],

        comment: [
            // eslint-disable-next-line
            [/[^\/*]+/, "comment"],
            [/\/\*/, "comment", "@push"], // nested comment
            ["\\*/", "comment", "@pop"],
            // eslint-disable-next-line
            [/[\/*]/, "comment"],
        ],

        string: [
            [/[^\\"]+/, "string"],
            [/@escapes/, "string.escape"],
            [/\\./, "string.escape.invalid"],
            [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
        ],

        whitespace: [
            [/[ \t\r\n]+/, "white"],
            [/\/\*/, "comment", "@comment"],
            [/\/\/.*$/, "comment"],
        ],
    },
});

// Register comment support for the new language
monaco.languages.setLanguageConfiguration("chuck", {
    comments: {
        lineComment: "//",
        blockComment: ["/*", "*/"],
    },
});

// ---------------------------------------------------------------
// Parse ckdoc function signatures for member completions
// ---------------------------------------------------------------
interface ParsedMethod {
    name: string;
    returnType: string;
    params: string;
    description: string;
}

const METHOD_REGEX = /```chuck\n(.+?)\s+(\w+)\(([^)]*)\)\n```\n?(.*)/;

function parseMethods(doc: docType): ParsedMethod[] {
    const methods: ParsedMethod[] = [];
    for (const fn of doc.functions) {
        if (fn.startsWith("**")) continue; // skip section headers
        const match = METHOD_REGEX.exec(fn);
        if (match) {
            methods.push({
                returnType: match[1],
                name: match[2],
                params: match[3],
                description: match[4].trim(),
            });
        }
    }
    return methods;
}

// Pre-build a map of class name -> parsed methods
const classMethods: Map<string, ParsedMethod[]> = new Map();
for (const key of Object.keys(ckdoc)) {
    if (key.startsWith("@")) continue; // skip @array etc for dot-completion
    const methods = parseMethods(ckdoc[key]);
    if (methods.length > 0) {
        classMethods.set(key, methods);
    }
}

// ---------------------------------------------------------------
// Snippet templates for common ChucK patterns
// ---------------------------------------------------------------
const snippetSuggestions = [
    {
        label: "random",
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: "Math.random2f(${1:min}, ${2:max})",
        insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: "Random float between min and max",
    },
    {
        label: "ifelse",
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ["if (${1:condition}) {", "\t$0", "} else {", "\t", "}"].join("\n"),
        insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: "If-Else Statement",
    },
    {
        label: "for",
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ["for (0 => int i; i < ${1:count}; ++i)", "{", "\t$0", "}"].join("\n"),
        insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: "For Statement",
    },
    {
        label: "while",
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ["while (${1:condition})", "{", "\t$0", "}"].join("\n"),
        insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: "While Statement",
    },
    {
        label: "repeat",
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ["repeat (${1:count})", "{", "\t$0", "}"].join("\n"),
        insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: "Repeat Statement",
    },
    {
        label: "sinosc",
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: "SinOsc ${1:s} => dac;\n${2:440} => ${1:s}.freq;\n$0",
        insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: "SinOsc => dac template",
    },
    {
        label: "timeloop",
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ["while (true)", "{", "\t$0", "\t${1:100}::ms => now;", "}"].join("\n"),
        insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: "Infinite time loop (while true with time advance)",
    },
    {
        label: "spork",
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: "spork ~ ${1:functionName}($0);",
        insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: "Spork a function as a new shred",
    },
    {
        label: "function",
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ["fun ${1:void} ${2:myFunc}($3)", "{", "\t$0", "}"].join("\n"),
        insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: "Function definition",
    },
    {
        label: "class",
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ["class ${1:MyClass}", "{", "\t$0", "}"].join("\n"),
        insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: "Class definition",
    },
    {
        label: "print",
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: "<<< ${1:\"hello\"} >>>;",
        insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: "ChucK print statement",
    },
    {
        label: "event",
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            "Event ${1:e};",
            "while (true)",
            "{",
            "\t${1:e} => now;",
            "\t$0",
            "}",
        ].join("\n"),
        insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: "Event listener pattern",
    },
];
const snippetLabels = new Set(snippetSuggestions.map((s) => s.label));

// ---------------------------------------------------------------
// Member completion provider (triggered by '.')
// ---------------------------------------------------------------
monaco.languages.registerCompletionItemProvider("chuck", {
    triggerCharacters: ["."],
    provideCompletionItems: (model, position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        const textBeforeCursor = lineContent.substring(0, position.column - 1);

        // Check if we're after a '.'
        const dotMatch = textBeforeCursor.match(/(\w+)\.\s*$/);
        if (!dotMatch) return { suggestions: [] };

        const typeName = dotMatch[1];
        const word = model.getWordUntilPosition(position);
        const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
        };

        // Look up the type in ckdoc — try direct match, then search
        // for variables declared as that type in the current file
        let methods = classMethods.get(typeName);

        if (!methods) {
            // Search for variable declaration: TypeName varName
            const fullText = model.getValue();
            const declRegex = new RegExp(`(\\w+)\\s+${typeName}\\b`);
            const declMatch = declRegex.exec(fullText);
            if (declMatch) {
                methods = classMethods.get(declMatch[1]);
            }
        }

        if (!methods) return { suggestions: [] };

        // Deduplicate by method name (keep first overload for insert)
        const seen = new Set<string>();
        const suggestions = [];
        for (const m of methods) {
            if (seen.has(m.name)) continue;
            seen.add(m.name);
            suggestions.push({
                label: m.name,
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: m.params
                    ? `${m.name}($0)`
                    : `${m.name}()`,
                insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: `${m.returnType} ${m.name}(${m.params})`,
                documentation: m.description,
                range: range,
            });
        }
        return { suggestions };
    },
});

// ---------------------------------------------------------------
// General completion provider (keywords, words, snippets)
// ---------------------------------------------------------------
monaco.languages.registerCompletionItemProvider("chuck", {
    provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
        };

        const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        });

        // Snippet suggestions with range
        const snippets = snippetSuggestions.map((s) => ({ ...s, range }));

        // Word-based suggestions from document + UGen names
        const words = textUntilPosition
            .split(/\W+/)
            .concat(chuck_modules)
            .filter((w) => !snippetLabels.has(w));
        const uniqueWords = Array.from(new Set(words));
        const word_suggestions = uniqueWords.map((w) => ({
            label: w,
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: w,
            range: range,
        }));

        // UGen/class suggestions with documentation from ckdoc
        const ckdocSuggestions = Object.keys(ckdoc)
            .filter((key) => !key.startsWith("@"))
            .map((key) => ({
                label: key,
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: key,
                detail: ckdoc[key].title.replace(/\*\*/g, ""),
                documentation: ckdoc[key].description,
                range: range,
            }));

        return {
            suggestions: [
                ...word_suggestions,
                ...snippets,
                ...ckdocSuggestions,
            ],
        };
    },
});

// ---------------------------------------------------------------
// Signature Help Provider (parameter hints on '(')
// ---------------------------------------------------------------
monaco.languages.registerSignatureHelpProvider("chuck", {
    signatureHelpTriggerCharacters: ["(", ","],
    provideSignatureHelp: (model, position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        const textBeforeCursor = lineContent.substring(0, position.column - 1);

        // Find the method call: identifier.method( or Type(
        const callMatch = textBeforeCursor.match(
            /(?:(\w+)\.)?(\w+)\([^)]*$/
        );
        if (!callMatch) return null;

        const objectName = callMatch[1];
        const methodName = callMatch[2];

        // Count commas to determine active parameter
        const afterParen = textBeforeCursor.substring(
            textBeforeCursor.lastIndexOf("(") + 1
        );
        const activeParameter = (afterParen.match(/,/g) || []).length;

        // Search for the method in ckdoc
        let allMethods: ParsedMethod[] = [];

        if (objectName) {
            // instance.method() — look up the type
            allMethods = classMethods.get(objectName) || [];
        }

        // Also check if methodName is a constructor (e.g. SinOsc())
        if (allMethods.length === 0 && ckdoc[methodName]) {
            const doc = ckdoc[methodName];
            allMethods = parseMethods({
                ...doc,
                functions: [...doc.constructors, ...doc.functions],
            });
        }

        const matchingMethods = allMethods.filter(
            (m) => m.name === methodName
        );
        if (matchingMethods.length === 0) return null;

        const signatures = matchingMethods.map((m) => {
            const params = m.params
                ? m.params.split(",").map((p) => {
                    const trimmed = p.trim();
                    return {
                        label: trimmed,
                        documentation: "",
                    };
                })
                : [];
            return {
                label: `${m.returnType} ${m.name}(${m.params})`,
                documentation: m.description,
                parameters: params,
            };
        });

        return {
            value: {
                signatures,
                activeSignature: 0,
                activeParameter,
            },
            dispose: () => {},
        };
    },
});

// Register a hover provider for the new language
monaco.languages.registerHoverProvider("chuck", {
    provideHover: function (model, position) {
        // Get the word at current mouse position
        const word: monaco.editor.IWordAtPosition =
            model.getWordAtPosition(position)!; // ! TS check that word is not null
        const token: string = word?.word;

        // If we have a hover for that word
        // if (chuck_modules.includes(token)) {
        if (ckdoc[token]) {
            const word_doc: docType = ckdoc[token];
            return {
                // Where to show the hover
                range: new monaco.Range(
                    position.lineNumber,
                    word.startColumn,
                    position.lineNumber,
                    word.endColumn
                ),
                // Hover contents
                contents: [
                    {
                        value: word_doc.title,
                    },
                    {
                        value: word_doc.description,
                    },
                    {
                        value: word_doc.constructors.join("\n\n"),
                    },
                    {
                        value: word_doc.functions.join("\n\n"),
                    },
                    {
                        value: word_doc.examples.join("\n\n"),
                    },
                    {
                        value: word_doc.link,
                    },
                ],
            };
        }

        // If we don't have a hover
        return null;
    },
});

export const editorConfig = monaco.editor.createModel("", "chuck");
