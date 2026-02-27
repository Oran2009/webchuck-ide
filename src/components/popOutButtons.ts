import { popOut, isPopOut, type PanelId } from "@/utils/popOut";
import OutputPanelHeader from "@/components/outputPanel/outputPanelHeader";

export default class PopOutButtons {
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
}
