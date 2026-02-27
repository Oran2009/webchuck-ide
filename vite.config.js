import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

// ------------------------------------------------------------------
// Monaco cross-window focus patch
// ------------------------------------------------------------------
// Monaco's focus-detection helpers call getActiveElement() which
// hardcodes to mainWindow.document.activeElement when only one window
// is registered (registerWindow is not exported). When the editor is
// in a pop-out window, this returns the wrong element so Monaco thinks
// the editor never has focus → cursor hidden, keyboard input ignored.
//
// Affected files:
//   textAreaEditContextInput.js  – TextAreaWrapper.hasFocus() and
//                                  TextAreaWrapper.setSelectionRange()
//   nativeEditContextUtils.js    – FocusTracker.refreshFocusState()
//
// The fix: use element.ownerDocument.activeElement instead, which
// correctly resolves to whichever document owns the DOM element.
//
// We apply this patch via BOTH:
//   - An esbuild plugin  (for dev-mode dependency pre-bundling)
//   - A Vite transform   (for production builds via Rollup)
// ------------------------------------------------------------------

const patches = [
    {
        file: /textAreaEditContextInput\.js$/,
        replacements: [
            // TextAreaWrapper.hasFocus()
            [
                "return getActiveElement() === this._actual;",
                "return this._actual.ownerDocument.activeElement === this._actual;",
            ],
            // TextAreaWrapper.setSelectionRange()
            [
                "activeElement = getActiveElement();",
                "activeElement = this._actual.ownerDocument.activeElement;",
            ],
        ],
    },
    {
        file: /nativeEditContextUtils\.js$/,
        replacements: [
            // FocusTracker.refreshFocusState()
            [
                "const activeElement = shadowRoot ? shadowRoot.activeElement : getActiveElement();",
                "const activeElement = shadowRoot ? shadowRoot.activeElement : this._domNode.ownerDocument.activeElement;",
            ],
        ],
    },
];

function applyPatches(code, filePath) {
    for (const patch of patches) {
        if (!patch.file.test(filePath)) continue;
        for (const [search, replace] of patch.replacements) {
            code = code.replace(search, replace);
        }
    }
    return code;
}

const allFilePatterns = patches.map((p) => p.file);

/** esbuild plugin – runs during Vite dependency pre-bundling (dev). */
const monacoFocusPatchEsbuild = {
    name: "fix-monaco-cross-window-focus",
    setup(build) {
        const combined = new RegExp(
            allFilePatterns.map((r) => r.source).join("|")
        );
        build.onLoad({ filter: combined }, async (args) => {
            const code = await fs.promises.readFile(args.path, "utf8");
            return { contents: applyPatches(code, args.path), loader: "js" };
        });
    },
};

/** Vite plugin – runs during production build (Rollup). */
const monacoFocusPatchVite = {
    name: "fix-monaco-cross-window-focus",
    transform(code, id) {
        if (!allFilePatterns.some((re) => re.test(id))) return;
        return applyPatches(code, id);
    },
};

export default defineConfig({
    base: "./",
    plugins: [monacoFocusPatchVite],
    optimizeDeps: {
        esbuildOptions: {
            plugins: [monacoFocusPatchEsbuild],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@components": path.resolve(__dirname, "./src/components"),
            "@utils": path.resolve(__dirname, "./src/utils"),
            "@services": path.resolve(__dirname, "./src/services"),
            "@styles": path.resolve(__dirname, "./src/styles"),
        },
    },
    server: {
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "credentialless",
        },
    },
});
