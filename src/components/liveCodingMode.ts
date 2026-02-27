//-----------------------------------------------------------
// title: LiveCodingMode
// desc:  Fullscreen live coding overlay — canvas/visualizer
//        as background with transparent code editor overlay,
//        console and VM monitor on the right.
//
// author: claude
// date:   February 2026
//-----------------------------------------------------------

import { monaco } from "@/components/editor/monaco/monacoLite";
import Editor from "@/components/editor/monaco/editor";
import Console from "@/components/outputPanel/console";
import { getActiveTheme, type IDETheme } from "@/utils/themes";
import { engineMode } from "@/host";
import FullscreenOverlay from "@/components/outputPanel/fullscreenOverlay";

export default class LiveCodingMode {
    // DOM references
    private static overlay: HTMLDivElement;
    private static bgMount: HTMLDivElement;
    private static editorMount: HTMLDivElement;
    private static topBarMount: HTMLDivElement;
    private static consoleMount: HTMLDivElement;
    private static vmMonitorMount: HTMLDivElement;

    // State
    private static isOpen: boolean = false;
    private static lcEditor: monaco.editor.IStandaloneCodeEditor | null = null;

    // Reparented element tracking
    private static originalBgParent: HTMLElement | null = null;
    private static reparentedBg: HTMLElement | null = null;
    private static originalBarParent: HTMLElement | null = null;
    private static originalBarNextSibling: Node | null = null;
    private static originalConsoleParent: HTMLElement | null = null;
    private static originalVmMonitorParent: HTMLElement | null = null;

    // Toast/tips state
    private static toastContainer: HTMLDivElement | null = null;

    // Bound event handlers
    private static boundOnKeyDown: (e: KeyboardEvent) => void;
    private static boundOnResize: () => void;

    constructor() {
        LiveCodingMode.overlay =
            document.querySelector<HTMLDivElement>("#liveCodingOverlay")!;
        LiveCodingMode.bgMount =
            document.querySelector<HTMLDivElement>("#liveCodingBg")!;
        LiveCodingMode.editorMount =
            document.querySelector<HTMLDivElement>("#liveCodingEditor")!;
        LiveCodingMode.topBarMount =
            document.querySelector<HTMLDivElement>("#liveCodingTopBar")!;
        LiveCodingMode.consoleMount =
            document.querySelector<HTMLDivElement>("#liveCodingConsole")!;
        LiveCodingMode.vmMonitorMount =
            document.querySelector<HTMLDivElement>("#liveCodingVmMonitor")!;

        LiveCodingMode.boundOnKeyDown = LiveCodingMode.onKeyDown.bind(LiveCodingMode);
        LiveCodingMode.boundOnResize = LiveCodingMode.onResize.bind(LiveCodingMode);

        // View menu toggle
        const toggle = document.querySelector<HTMLButtonElement>("#liveCodingToggle")!;
        toggle.addEventListener("click", () => LiveCodingMode.toggle());
    }

    /**
     * Toggle live coding mode on/off
     */
    static toggle() {
        if (LiveCodingMode.isOpen) {
            LiveCodingMode.close();
        } else {
            LiveCodingMode.open();
        }
    }

    /**
     * Open live coding mode
     */
    static open() {
        if (LiveCodingMode.isOpen) return;

        // Close fullscreen overlay if open
        if (FullscreenOverlay.opened) {
            FullscreenOverlay.close();
        }

        LiveCodingMode.isOpen = true;

        // 1. Reparent background (canvas or visualizer)
        const bgElement = LiveCodingMode.getBackgroundElement();
        if (bgElement) {
            LiveCodingMode.originalBgParent = bgElement.parentElement;
            LiveCodingMode.reparentedBg = bgElement;
            LiveCodingMode.bgMount.appendChild(bgElement);
            bgElement.classList.remove("hidden");
        }

        // 2. Reparent ChucK bar
        const chuckBar = document.querySelector<HTMLDivElement>("#chuckBar")!;
        LiveCodingMode.originalBarParent = chuckBar.parentElement;
        LiveCodingMode.originalBarNextSibling = chuckBar.nextSibling;
        LiveCodingMode.topBarMount.appendChild(chuckBar);

        // 3. Hide tips in the toast container
        LiveCodingMode.toastContainer =
            document.querySelector<HTMLDivElement>("#toastContainer");
        if (LiveCodingMode.toastContainer) {
            LiveCodingMode.toastContainer.style.display = "none";
        }

        // 4. Reparent console
        const consoleContainer =
            document.querySelector<HTMLDivElement>("#consoleContainer")!;
        LiveCodingMode.originalConsoleParent = consoleContainer.parentElement;
        LiveCodingMode.consoleMount.appendChild(consoleContainer);
        consoleContainer.classList.remove("hidden");
        // Clear inline bg so the transparent CSS takes over
        const consoleInner =
            document.querySelector<HTMLDivElement>("#console");
        if (consoleInner) {
            consoleInner.style.backgroundColor = "transparent";
        }

        // 5. Reparent VM monitor
        const vmMonitorContainer =
            document.querySelector<HTMLDivElement>("#vmMonitorContainer")!;
        LiveCodingMode.originalVmMonitorParent = vmMonitorContainer.parentElement;
        LiveCodingMode.vmMonitorMount.appendChild(vmMonitorContainer);
        vmMonitorContainer.classList.remove("hidden");

        // 6. Show overlay
        LiveCodingMode.overlay.classList.remove("hidden");

        // 7. Create transparent Monaco editor
        LiveCodingMode.createEditor();

        // 8. Add event listeners
        document.addEventListener("keydown", LiveCodingMode.boundOnKeyDown);
        window.addEventListener("resize", LiveCodingMode.boundOnResize);

        // 9. Layout after reparent
        requestAnimationFrame(() => {
            LiveCodingMode.onResize();
            LiveCodingMode.lcEditor?.focus();
        });
    }

    /**
     * Close live coding mode
     */
    static close() {
        if (!LiveCodingMode.isOpen) return;

        // 1. Dispose overlay editor
        if (LiveCodingMode.lcEditor) {
            LiveCodingMode.lcEditor.dispose();
            LiveCodingMode.lcEditor = null;
        }

        // 2. Reparent background back
        if (LiveCodingMode.originalBgParent && LiveCodingMode.reparentedBg) {
            LiveCodingMode.originalBgParent.appendChild(LiveCodingMode.reparentedBg);
        }

        // 3. Reparent ChucK bar back
        if (LiveCodingMode.originalBarParent) {
            const chuckBar = document.querySelector<HTMLDivElement>("#chuckBar")!;
            if (LiveCodingMode.originalBarNextSibling) {
                LiveCodingMode.originalBarParent.insertBefore(
                    chuckBar,
                    LiveCodingMode.originalBarNextSibling
                );
            } else {
                LiveCodingMode.originalBarParent.appendChild(chuckBar);
            }
        }

        // 4. Restore toast container visibility
        if (LiveCodingMode.toastContainer) {
            LiveCodingMode.toastContainer.style.display = "";
            LiveCodingMode.toastContainer = null;
        }

        // 5. Reparent console back
        if (LiveCodingMode.originalConsoleParent) {
            const consoleContainer =
                document.querySelector<HTMLDivElement>("#consoleContainer")!;
            LiveCodingMode.originalConsoleParent.appendChild(consoleContainer);
            // Restore inline bg
            const consoleInner =
                document.querySelector<HTMLDivElement>("#console");
            if (consoleInner) {
                consoleInner.style.backgroundColor =
                    "var(--ide-console-bg, #fff)";
            }
        }

        // 6. Reparent VM monitor back
        if (LiveCodingMode.originalVmMonitorParent) {
            const vmMonitorContainer =
                document.querySelector<HTMLDivElement>("#vmMonitorContainer")!;
            LiveCodingMode.originalVmMonitorParent.appendChild(vmMonitorContainer);
        }

        // 7. Hide overlay
        LiveCodingMode.overlay.classList.add("hidden");

        // 8. Remove event listeners
        document.removeEventListener("keydown", LiveCodingMode.boundOnKeyDown);
        window.removeEventListener("resize", LiveCodingMode.boundOnResize);

        // 9. Reset state
        LiveCodingMode.isOpen = false;
        LiveCodingMode.originalBgParent = null;
        LiveCodingMode.reparentedBg = null;
        LiveCodingMode.originalBarParent = null;
        LiveCodingMode.originalBarNextSibling = null;
        LiveCodingMode.originalConsoleParent = null;
        LiveCodingMode.originalVmMonitorParent = null;

        // 10. Resize main editor and console
        requestAnimationFrame(() => {
            Editor.resizeEditor();
            Editor.focusEditor();
            Console.resizeConsole();
        });
    }

    /**
     * Get the background element based on engine mode
     */
    private static getBackgroundElement(): HTMLElement | null {
        if (engineMode === "webchugl") {
            return document.querySelector<HTMLDivElement>("#canvasContainer");
        }
        return document.querySelector<HTMLDivElement>("#visualizerContainer");
    }

    /**
     * Create a transparent Monaco editor sharing the main editor's model
     */
    private static createEditor() {
        const model = Editor.getModel();
        if (!model) return;

        const theme = getActiveTheme();
        LiveCodingMode.defineTransparentTheme(theme);

        LiveCodingMode.lcEditor = monaco.editor.create(LiveCodingMode.editorMount, {
            model: model,
            theme: "liveCoding",
            language: "chuck",
            minimap: { enabled: false },
            automaticLayout: false,
            scrollBeyondLastLine: false,
            fontSize: parseInt(localStorage.getItem("editorFontSize") || "14"),
            cursorBlinking: "smooth",
            stickyScroll: { enabled: false },
            lineNumbers: "on",
            renderLineHighlight: "none",
            scrollbar: {
                vertical: "hidden",
                horizontal: "hidden",
            },
        });
    }

    /**
     * Define the transparent Monaco theme based on the active IDE theme
     */
    private static defineTransparentTheme(theme: IDETheme) {
        const c = theme.colors;
        monaco.editor.defineTheme("liveCoding", {
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
                "editor.background": "#00000000",
                "editor.lineHighlightBackground": "#00000000",
                "editorGutter.background": "#00000000",
                "editor.selectionBackground": "#ffffff30",
                "editorCursor.foreground": "#ffffff",
            },
        });
    }

    /**
     * Called when the IDE theme changes — update transparent theme if open
     */
    static onThemeChange(theme: IDETheme) {
        if (!LiveCodingMode.isOpen || !LiveCodingMode.lcEditor) return;
        LiveCodingMode.defineTransparentTheme(theme);
        LiveCodingMode.lcEditor.updateOptions({ theme: "liveCoding" });
    }

    /**
     * Handle keyboard shortcuts
     */
    private static onKeyDown(e: KeyboardEvent) {
        // Escape closes live coding mode
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            LiveCodingMode.close();
        }
    }

    /**
     * Handle resize — re-layout the overlay editor and console
     */
    private static onResize() {
        if (!LiveCodingMode.isOpen) return;
        LiveCodingMode.lcEditor?.layout();
        Console.fit();
    }

    /**
     * Whether live coding mode is currently open
     */
    static get active(): boolean {
        return LiveCodingMode.isOpen;
    }
}
