//------------------------------------------------------------------
// title: Editor
// desc:  Monaco editor and functionality for WebChucK IDE
//        Depends on all files in the editor folder
//
// author: terry feng
// date:   May 2023
//------------------------------------------------------------------

import ChuckBar from "@/components/chuckBar/chuckBar";

import { monaco } from "./monacoLite";
import { editorConfig } from "./chuck-lang";
import { initVimMode, VimMode } from "monaco-vim";
import { miniAudicleLight, miniAudicleDark } from "./miniAudicleTheme";
import EditorPanelHeader from "@/components/editor/editorPanelHeader";
import WelcomeTab from "@/components/editor/welcomeTab";
import Toast from "@/components/toast";
import ProjectSystem from "../../fileExplorer/projectSystem";
import FindInProject from "../../fileExplorer/findInProject";
import GUI from "@/components/inputPanel/gui/gui";
import { getActiveTheme, PRESET_THEMES, applyTheme } from "@/utils/themes";
import Pet from "@/components/pet";
import LiveCodingMode from "@/components/liveCodingMode";


// Constants
const VIM_STATUS_HEIGHT: string = "1.75rem";

// Define editor themes
monaco.editor.defineTheme("miniAudicleLight", miniAudicleLight);
monaco.editor.defineTheme("miniAudicleDark", miniAudicleDark);

export default class Editor {
    // Private variables
    private static editor: monaco.editor.IStandaloneCodeEditor;
    // Staic variables
    public static filename: string = "untitled.ck";
    public static editorContainer: HTMLDivElement;
    public static vimStatus: HTMLDivElement;
    public static vimToggle: HTMLButtonElement;
    public static vimMode: boolean = localStorage.getItem("vimMode") === "true";
    private static vimModule: any; // for the vim object from monaco-vim
    private static saveTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(editorContainer: HTMLDivElement) {
        Editor.editorContainer = editorContainer;
        Editor.editor = monaco.editor.create(editorContainer, {
            // Params
            language: "chuck",
            minimap: {
                enabled: false,
            },
            model: editorConfig,
            theme:
                localStorage.theme === "dark"
                    ? "miniAudicleDark"
                    : "miniAudicleLight",
            automaticLayout: false,
            scrollBeyondLastLine: false,
            fontSize: parseInt(localStorage.getItem("editorFontSize") || "14"),
            cursorBlinking: "smooth",
            stickyScroll: { enabled: false },
            fixedOverflowWidgets: true,
        });

        // Apply saved theme to Monaco (initTheme runs before Editor is created)
        Editor.applyDynamicTheme(getActiveTheme());

        // Editor autosave config
        Editor.loadAutoSave();
        // When the editor is changed, update project system immediately
        // but debounce localStorage save to avoid hammering on every keystroke
        Editor.editor.onDidChangeModelContent(() => {
            if (WelcomeTab.isVisible()) {
                WelcomeTab.dismiss();
            }
            ProjectSystem.updateActiveFile(Editor.getEditorCode());
            if (Editor.saveTimer) clearTimeout(Editor.saveTimer);
            Editor.saveTimer = setTimeout(() => Editor.saveCode(), 300);
        });

        // Vim Toggle
        Editor.vimToggle =
            document.querySelector<HTMLButtonElement>("#vimToggle")!;
        Editor.vimToggle.addEventListener("click", () => {
            this.toggleVimMode();
            Editor.resizeEditor();
        });
        // Initialize Vim mode
        Editor.vimStatus =
            document.querySelector<HTMLDivElement>("#vimStatus")!;
        Editor.vimMode ? this.vimModeOn() : this.vimModeOff();

        // Editor font size controls
        document.getElementById("editorFontDown")?.addEventListener("click", () => Editor.changeEditorFontSize(-1));
        document.getElementById("editorFontUp")?.addEventListener("click", () => Editor.changeEditorFontSize(1));

        // Resize editor on window resize
        window.addEventListener("resize", () => {
            Editor.resizeEditor();
        });

        // VimMode.Vim.defineEx(name, shorthand, callback);
        VimMode.Vim.defineEx("write", "w", function () {
            ProjectSystem.updateActiveFile(Editor.getEditorCode());
            Editor.saveCode();
            GUI.generateGUI();
        });
        // Keybindings
        Editor.initMonacoKeyBindings();
    }

    /**
     * Load the autosave from local storage
     */
    static loadAutoSave() {
        // Try loading full project first
        if (ProjectSystem.loadProject()) {
            const count = ProjectSystem.size();
            Console.print(
                `loaded autosave: ${count} file${count !== 1 ? "s" : ""} (${localStorage.getItem("editorCodeTime")})`
            );
            return;
        }

        // Fall back to legacy single-file autosave
        const filename =
            localStorage.getItem("editorFilename") || "untitled.ck";
        const code = localStorage.getItem("editorCode") || "";
        if (code === "") {
            Editor.loadDefault();
            return;
        }
        ProjectSystem.addNewFile(filename, code);

        if (isSettingsReload) {
            Toast.info("Settings applied!");
        } else {
            Toast.info(
                `loaded autosave: ${Editor.filename} (${localStorage.getItem("editorCodeTime")})`
            );
        }
    }

    static async loadDefault() {
        const editorPanel = document.getElementById("editorPanel")!;
        WelcomeTab.show(editorPanel);
        ProjectSystem.addNewFile("untitled.ck", "");
    }

    /**
     * Save the code to local storage
     */
    static saveCode() {
        localStorage.setItem("editorCode", Editor.getEditorCode());
        localStorage.setItem("editorFilename", Editor.getFileName());
        localStorage.setItem("editorCodeTime", new Date().toLocaleString());
        ProjectSystem.saveProject();
    }

    /**
     * Resize the editor
     */
    static resizeEditor() {
        Editor.editor?.layout();
        Pet.resize();
    }

    /**
     * Destroy and recreate the Monaco editor instance in its current
     * document context.  Used when the editor container is reparented
     * to a pop-out window (or back) so that Monaco rebinds its
     * internal DOM elements and event listeners to the new document.
     */
    static recreateEditor() {
        // Save state
        const model = Editor.editor.getModel();
        const viewState = Editor.editor.saveViewState();
        const fontSize = Editor.editor.getOption(
            monaco.editor.EditorOption.fontSize
        );

        // Dispose vim mode before disposing editor
        if (Editor.vimMode) {
            Editor.vimModule?.dispose();
        }

        // Dispose old editor (externally-created model survives)
        Editor.editor.dispose();

        // Create new editor in the (possibly reparented) container
        Editor.editor = monaco.editor.create(Editor.editorContainer, {
            language: "chuck",
            minimap: { enabled: false },
            model: model,
            automaticLayout: false,
            scrollBeyondLastLine: false,
            fontSize: fontSize,
            cursorBlinking: "smooth",
            stickyScroll: { enabled: false },
            fixedOverflowWidgets: true,
        });

        // Apply current theme
        Editor.applyDynamicTheme(getActiveTheme());

        // Restore cursor position and scroll
        if (viewState) {
            Editor.editor.restoreViewState(viewState);
        }

        // Re-register content change handler
        Editor.editor.onDidChangeModelContent(() => {
            if (WelcomeTab.isVisible()) {
                WelcomeTab.dismiss();
            }
            ProjectSystem.updateActiveFile(Editor.getEditorCode());
            if (Editor.saveTimer) clearTimeout(Editor.saveTimer);
            Editor.saveTimer = setTimeout(() => Editor.saveCode(), 300);
        });

        // Re-register keybindings and command palette actions
        Editor.initMonacoKeyBindings();

        // Restore vim mode
        if (Editor.vimMode) {
            Editor.vimModule = initVimMode(Editor.editor, Editor.vimStatus);
        }

        Editor.resizeEditor();
        Editor.editor.focus();
    }

    /**
     * Focus the editor
     */
    static focusEditor() {
        Editor.editor?.focus();
    }

    /**
     * Force a synchronous render of the editor.
     */
    static forceRender() {
        Editor.editor?.render(true);
    }

    /**
     * Change the editor font size by delta
     */
    static changeEditorFontSize(delta: number) {
        const current = Editor.editor.getOption(monaco.editor.EditorOption.fontSize);
        const next = Math.max(10, Math.min(24, current + delta));
        Editor.editor.updateOptions({ fontSize: next });
        localStorage.setItem("editorFontSize", String(next));
    }

    /**
     * Set the editor theme
     */
    static setTheme(dark: boolean) {
        Editor.editor?.updateOptions({
            theme: dark ? "miniAudicleDark" : "miniAudicleLight",
        });
    }

    /**
     * Apply a dynamic theme from the IDETheme system
     */
    static applyDynamicTheme(theme: import("@/utils/themes").IDETheme) {
        const c = theme.colors;
        const themeName = "ideTheme-" + theme.id;
        monaco.editor.defineTheme(themeName, {
            base: theme.isDark ? "vs-dark" : "vs",
            inherit: true,
            rules: [
                { token: "", foreground: c.editorText.replace("#", "") },
                { token: "keyword", foreground: c.editorKeyword.replace("#", "") },
                { token: "type", foreground: c.editorType.replace("#", "") },
                { token: "comment", foreground: c.editorComment.replace("#", "") },
                { token: "string", foreground: c.editorString.replace("#", "") },
                { token: "number", foreground: c.editorNumber.replace("#", "") },
                { token: "event", foreground: c.editorEvent.replace("#", "") },
                { token: "library", foreground: c.editorLibrary.replace("#", "") },
            ],
            colors: {
                "editor.background": c.editorBg,
            },
        });
        Editor.editor?.updateOptions({ theme: themeName });
    }

    /**
     * Add custom keybindings to the editor
     */
    static initMonacoKeyBindings() {
        // Experimental shortcut
        Editor.editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period,
            () => {
                ChuckBar.startWebchuck();
            }
        );
        // global keyboard shortcuts
        Editor.editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            () => {
                if (ChuckBar.running) ChuckBar.runEditorCode();
            }
        );

        Editor.editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backslash,
            () => {
                if (ChuckBar.running) ChuckBar.replaceCode();
            }
        );

        Editor.editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backspace,
            () => {
                if (ChuckBar.running) ChuckBar.removeCode();
            }
        );

        Editor.editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            () => {
                GUI.generateGUI();
            }
        );

        // Command palette actions
        Editor.editor.addAction({
            id: "webchuck.findInFiles",
            label: "Find in Files",
            run: () => {
                FindInProject.toggle();
            },
        });
    }

    /**
     * Get the contents of the editor
     * @returns the contents of the editor
     */
    public static getEditorCode(): string {
        return Editor.editor?.getValue();
    }

    /**
     * Get the underlying Monaco editor model (for sharing with live coding mode)
     */
    public static getModel(): monaco.editor.ITextModel | null {
        return Editor.editor?.getModel();
    }

    /**
     * Set the contents of the editor
     * @param code code to replace in the editor
     */
    public static setEditorCode(code: string) {
        Editor.editor.setScrollTop(0);
        Editor.editor.setPosition({ lineNumber: 1, column: 1 });
        Editor.editor.setValue(code);
    }

    /**
     * Open Monaco's command palette programmatically
     */
    static openCommandPalette() {
        Editor.editor.focus();
        Editor.editor.trigger("", "editor.action.quickCommand", null);
    }

    /**
     * Reveal and highlight a specific line in the editor
     */
    static revealLine(lineNumber: number) {
        Editor.editor?.revealLineInCenter(lineNumber);
        Editor.editor?.setPosition({ lineNumber, column: 1 });
        Editor.editor?.focus();
    }

    /**
     * Set the file name
     * @param name The file name
     */
    static setFileName(name: string) {
        Editor.filename = name;
        localStorage.setItem("editorFilename", name);
        EditorPanelHeader.updateFileName(name);
    }

    /**
     * Get the current file name
     * @returns The current file name
     */
    static getFileName(): string {
        return Editor.filename;
    }

    /**
     * Change the editor font size by delta
     */
    static changeEditorFontSize(delta: number) {
        const current = Editor.editor.getOption(monaco.editor.EditorOption.fontSize);
        const next = Math.max(10, Math.min(24, current + delta));
        Editor.editor.updateOptions({ fontSize: next });
        localStorage.setItem("editorFontSize", String(next));
    }

    /**
     * Toggle Vim mode
     */
    toggleVimMode() {
        Editor.vimMode ? this.vimModeOff() : this.vimModeOn();
    }
    /**
     * Turn on Vim mode and configure the editor height
     */
    vimModeOn() {
        // Adjust editor bottom to make room for Vim status bar
        Editor.editorContainer.setAttribute(
            "style",
            `bottom: ${VIM_STATUS_HEIGHT}`
        );
        Editor.resizeEditor();
        Editor.vimModule = initVimMode(Editor.editor, Editor.vimStatus);
        // editor block cursor
        Editor.vimToggle.innerText = "Vim Mode: On";
        Editor.vimStatus.setAttribute("style", "display: flex !important");

        localStorage.setItem("vimMode", "true");
        Editor.vimMode = true;
    }
    /**
     * Turn off Vim mode
     */
    vimModeOff() {
        // Reset editor to stretch to bottom
        Editor.editorContainer.setAttribute(
            "style",
            "bottom: 0"
        );
        Editor.resizeEditor();
        Editor.vimModule?.dispose();
        Editor.editor.updateOptions({
            cursorStyle: "line",
            cursorBlinking: "smooth",
        });
        Editor.vimToggle.innerText = "Vim Mode: Off";
        Editor.vimStatus?.setAttribute("style", "display: none !important");
        Editor.editorContainer.style.top = HEADER_HEIGHT;
        Editor.resizeEditor();

        localStorage.setItem("vimMode", "false");
        Editor.vimMode = false;
    }
}
