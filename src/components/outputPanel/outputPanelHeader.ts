import Console from "@/components/outputPanel/console";
import Editor from "@/components/editor/monaco/editor";
import FullscreenOverlay from "@components/outputPanel/fullscreenOverlay";
import OutputHeaderToggle from "@components/toggle/outputHeaderToggle";
import { visual, engineMode } from "@/host";
import { getAppColumnWidths, setAppColumnWidths } from "@/utils/appLayout";

const OUTPUT_HEADER_HEIGHT: number = 1.75; // rem

export default class OutputPanelHeader {
    public static vmMonitorContainer: HTMLDivElement;
    public static consoleContainer: HTMLDivElement;
    public static vmMonitorContainer: HTMLDivElement;
    public static visualizerContainer: HTMLDivElement;
    public static canvasContainer: HTMLDivElement;
    public static fullscreenButton: HTMLButtonElement;
    private static savedColumnWidths: [number, number, number] | null = null;

    constructor() {
        // Setup Output Panel Header Tabs
        // VM Monitor
        const vmMonitorButton =
            document.querySelector<HTMLButtonElement>("#vmMonitorTab")!;
        OutputPanelHeader.vmMonitorContainer =
            document.querySelector<HTMLDivElement>("#vmMonitorContainer")!;
        // Console
        const consoleButton =
            document.querySelector<HTMLButtonElement>("#consoleTab")!;
        OutputPanelHeader.consoleContainer =
            document.querySelector<HTMLDivElement>("#consoleContainer")!;
        // VM Monitor
        const vmMonitorButton =
            document.querySelector<HTMLButtonElement>("#vmMonitorTab")!;
        OutputPanelHeader.vmMonitorContainer =
            document.querySelector<HTMLDivElement>("#vmMonitorContainer")!;
        // Visualizer
        const visualizerButton =
            document.querySelector<HTMLButtonElement>("#visualizerTab")!;
        OutputPanelHeader.visualizerContainer =
            document.querySelector<HTMLDivElement>("#visualizerContainer")!;
        // Canvas (ChuGL)
        const canvasButton =
            document.querySelector<HTMLButtonElement>("#canvasTab")!;
        OutputPanelHeader.canvasContainer =
            document.querySelector<HTMLDivElement>("#canvasContainer")!;

        // Fullscreen button
        OutputPanelHeader.fullscreenButton =
            document.querySelector<HTMLButtonElement>("#fullscreenBtn")!;
        OutputPanelHeader.fullscreenButton.addEventListener("click", () => {
            OutputPanelHeader.openFullscreen();
        });

        // Build toggles — defaults depend on engine mode
        const isChuGL = engineMode === "webchugl";

        new OutputHeaderToggle(
            vmMonitorButton,
            OutputPanelHeader.vmMonitorContainer,
            !isChuGL // active by default in WebChucK mode
        );
        new OutputHeaderToggle(
            consoleButton,
            OutputPanelHeader.consoleContainer,
            true // always active by default
        );
        new OutputHeaderToggle(
            vmMonitorButton,
            OutputPanelHeader.vmMonitorContainer,
            true
        );
        new OutputHeaderToggle(
            visualizerButton,
            OutputPanelHeader.visualizerContainer
        );

        // Canvas tab — only visible in WebChuGL mode
        if (isChuGL) {
            canvasButton.classList.remove("hidden");
            new OutputHeaderToggle(
                canvasButton,
                OutputPanelHeader.canvasContainer,
                true // active by default in ChuGL mode
            );
        }

        // Recalculate split heights on window resize
        window.addEventListener("resize", () => {
            OutputPanelHeader.updateOutputPanel(
                OutputHeaderToggle.numActive
            );
        });
    }

    /**
     * Determine which output tab is active and open the fullscreen overlay
     */
    static openFullscreen() {
        if (
            !OutputPanelHeader.canvasContainer.classList.contains("hidden")
        ) {
            FullscreenOverlay.open("canvas");
        } else if (
            !OutputPanelHeader.visualizerContainer.classList.contains(
                "hidden"
            )
        ) {
            FullscreenOverlay.open("visualizer");
        }
    }

    /**
     * Update the Output Panel after a tab toggle or resize.
     * Content uses absolute-inset-0 containment so CSS flex: 1 1 0%
     * handles equal sizing; we only need to re-fit xterm and the visualizer.
     * @param tabsActive number of tabs active
     */
    static updateOutputPanel(tabsActive: number) {
        const collapsed = tabsActive === 0;
        document.getElementById("app")?.classList.toggle(
            "output-collapsed",
            collapsed
        );

        // Collapse/expand the right column on desktop only
        if (window.innerWidth > 640) {
            if (collapsed && !OutputPanelHeader.savedColumnWidths) {
                OutputPanelHeader.savedColumnWidths = getAppColumnWidths();
                const app = document.getElementById("app")!;
                const [left] = OutputPanelHeader.savedColumnWidths;
                app.style.gridTemplateColumns = `${left}% 2px 1fr 2px auto`;
                requestAnimationFrame(() => Editor.resizeEditor());
            } else if (!collapsed && OutputPanelHeader.savedColumnWidths) {
                setAppColumnWidths(OutputPanelHeader.savedColumnWidths);
                OutputPanelHeader.savedColumnWidths = null;
            }
        }

        // Show console font size buttons only when console is visible
        const consoleFontSize = document.getElementById("consoleFontSize");
        if (consoleFontSize) {
            const consoleVisible = !OutputPanelHeader.consoleContainer.classList.contains("hidden");
            consoleFontSize.classList.toggle("hidden", !consoleVisible);
        }

        if (collapsed) {
            requestAnimationFrame(() => Editor.resizeEditor());
            return;
        }

        // Split the container heights evenly
        const splitHeight: string = `calc((100% - ${OUTPUT_HEADER_HEIGHT}rem)/${tabsActive})`;
        OutputPanelHeader.consoleContainer.style.height = splitHeight;
        OutputPanelHeader.visualizerContainer.style.height = splitHeight;
        OutputPanelHeader.canvasContainer.style.height = splitHeight;

        // Add border-top between visible panels, skip the first one
        const panels = [
            OutputPanelHeader.consoleContainer,
            OutputPanelHeader.vmMonitorContainer,
            OutputPanelHeader.visualizerContainer,
            OutputPanelHeader.canvasContainer,
        ];
        let first = true;
        for (const panel of panels) {
            if (panel.classList.contains("hidden")) {
                panel.style.borderTop = "";
                continue;
            }
            panel.style.borderTop = first
                ? "none"
                : "1px solid var(--ide-border, #C9E0F7)";
            first = false;
        }

        // Defer resize to next frame so layout is settled
        requestAnimationFrame(() => {
            Console.resizeConsole();
            visual?.resize();
        });
    }

}
