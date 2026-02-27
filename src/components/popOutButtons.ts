import { popOut, isPopOut, type PanelId } from "@/utils/popOut";
import OutputPanelHeader from "@/components/outputPanel/outputPanelHeader";

export default class PopOutButtons {
    private static activeContextMenu: HTMLDivElement | null = null;

    constructor() {
        // File Explorer pop-out
        const feBtn = document.querySelector<HTMLButtonElement>("#popOutFileExplorer");
        feBtn?.addEventListener("click", () => {
            if (!isPopOut("fileExplorer")) popOut("fileExplorer");
        });

        // Editor pop-out
        const edBtn = document.querySelector<HTMLButtonElement>("#popOutEditor");
        edBtn?.addEventListener("click", () => {
            if (!isPopOut("editor")) popOut("editor");
        });

        // Output panel pop-out — pops out whichever tab is currently visible
        const outBtn = document.querySelector<HTMLButtonElement>("#popOutOutput");
        outBtn?.addEventListener("click", () => {
            const panelId = PopOutButtons.getActiveOutputPanel();
            if (panelId && !isPopOut(panelId)) popOut(panelId);
        });

        // Right-click context menu on panel headers
        const headers: { el: string; panelId: PanelId | "output" }[] = [
            { el: "#fileExplorerHeader", panelId: "fileExplorer" },
            { el: "#editorPanelHeader", panelId: "editor" },
            { el: "#outputPanelHeader", panelId: "output" },
        ];

        for (const { el, panelId } of headers) {
            document
                .querySelector(el)
                ?.addEventListener("contextmenu", (e: Event) => {
                    const me = e as MouseEvent;
                    me.preventDefault();
                    const id =
                        panelId === "output"
                            ? PopOutButtons.getActiveOutputPanel()
                            : panelId;
                    if (id && !isPopOut(id)) {
                        PopOutButtons.showContextMenu(
                            me.clientX,
                            me.clientY,
                            id,
                        );
                    }
                });
        }
    }

    /**
     * Determine which output tab is currently visible (topmost).
     * Priority: console > vmMonitor > visualizer > canvas
     */
    static getActiveOutputPanel(): PanelId | null {
        if (!OutputPanelHeader.consoleContainer.classList.contains("hidden")) return "console";
        if (!OutputPanelHeader.vmMonitorContainer.classList.contains("hidden")) return "vmMonitor";
        if (!OutputPanelHeader.visualizerContainer.classList.contains("hidden")) return "visualizer";
        if (!OutputPanelHeader.canvasContainer.classList.contains("hidden")) return "canvas";
        return null;
    }

    static showContextMenu(x: number, y: number, panelId: PanelId): void {
        PopOutButtons.hideContextMenu();

        const menu = document.createElement("div");
        menu.className =
            "fixed z-[9999] py-1 rounded-md shadow-lg text-sm min-w-[140px]";
        menu.style.cssText = `left:${x}px;top:${y}px;background:var(--ide-bg-alt,#fff);border:1px solid var(--ide-border,#ccc);color:var(--ide-text,#555);`;

        const item = document.createElement("button");
        item.type = "button";
        item.className =
            "w-full text-left px-3 py-1.5 hover:bg-blue-500/10 transition-colors flex items-center gap-2";
        item.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg> Pop Out`;
        item.addEventListener("click", () => {
            popOut(panelId);
            PopOutButtons.hideContextMenu();
        });

        menu.appendChild(item);
        document.body.appendChild(menu);
        PopOutButtons.activeContextMenu = menu;

        // Close on click outside or Escape
        const close = (e: Event) => {
            if (!menu.contains(e.target as Node)) {
                PopOutButtons.hideContextMenu();
            }
        };
        const closeKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") PopOutButtons.hideContextMenu();
        };
        setTimeout(() => {
            document.addEventListener("click", close, { once: true });
            document.addEventListener("keydown", closeKey, { once: true });
        }, 0);
    }

    static hideContextMenu(): void {
        if (PopOutButtons.activeContextMenu) {
            PopOutButtons.activeContextMenu.remove();
            PopOutButtons.activeContextMenu = null;
        }
    }
}
