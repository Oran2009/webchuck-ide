//-----------------------------------------------------------
// title: PopOutManager
// desc:  Manages popping IDE panels out into separate browser
//        windows and docking them back.
//
// author: ben hoang
// date:   February 2026
//-----------------------------------------------------------

import Editor from "@/components/editor/monaco/editor";
import Console from "@/components/outputPanel/console";
import FindInProject from "@/components/fileExplorer/findInProject";
import FullscreenOverlay from "@/components/outputPanel/fullscreenOverlay";
import OutputPanelHeader from "@/components/outputPanel/outputPanelHeader";
import GUI from "@/components/inputPanel/gui/gui";
import Toast from "@/components/toast";
import { visual } from "@/host";
import {
    getAppColumnWidths,
    setAppColumnWidths,
    toggleLeft,
    deactivateSplitter,
    activateSplitter,
} from "@/utils/appLayout";

//-----------------------------------------------------------
// Types
//-----------------------------------------------------------

export type PanelId =
    | "fileExplorer"
    | "editor"
    | "console"
    | "vmMonitor"
    | "visualizer"
    | "canvas";

interface PopOutState {
    window: Window;
    originalParent: HTMLElement;
    reparentedElement: HTMLElement;
    nextSibling: ChildNode | null;
    savedLayoutWidths: [number, number, number];
    wasLeftPanelOpen: boolean;
    wasHidden: boolean;
    onBeforeUnload: () => void;
    heartbeat: ReturnType<typeof setInterval>;
}

interface PanelConfig {
    elementId: string;
    title: string;
    defaultWidth: number;
    defaultHeight: number;
}

//-----------------------------------------------------------
// Panel Configs
//-----------------------------------------------------------

const PANEL_CONFIGS: Record<PanelId, PanelConfig> = {
    fileExplorer: {
        elementId: "fileExplorerPanel",
        title: "File Explorer",
        defaultWidth: 300,
        defaultHeight: 600,
    },
    editor: {
        elementId: "app-middle",
        title: "Editor",
        defaultWidth: 800,
        defaultHeight: 600,
    },
    console: {
        elementId: "consoleContainer",
        title: "Console",
        defaultWidth: 600,
        defaultHeight: 400,
    },
    vmMonitor: {
        elementId: "vmMonitorContainer",
        title: "VM Monitor",
        defaultWidth: 500,
        defaultHeight: 400,
    },
    visualizer: {
        elementId: "visualizerContainer",
        title: "Visualizer",
        defaultWidth: 600,
        defaultHeight: 400,
    },
    canvas: {
        elementId: "canvasContainer",
        title: "Canvas",
        defaultWidth: 800,
        defaultHeight: 600,
    },
};

//-----------------------------------------------------------
// Shared constants
//-----------------------------------------------------------

const OUTPUT_PANEL_IDS: PanelId[] = [
    "console",
    "vmMonitor",
    "visualizer",
    "canvas",
];

const OUTPUT_TAB_MAP: Record<string, string> = {
    console: "consoleTab",
    vmMonitor: "vmMonitorTab",
    visualizer: "visualizerTab",
    canvas: "canvasTab",
};

function isOutputPanel(panelId: PanelId): boolean {
    return OUTPUT_PANEL_IDS.includes(panelId);
}

//-----------------------------------------------------------
// Registry of active pop-outs
//-----------------------------------------------------------

const popOuts = new Map<PanelId, PopOutState>();

//-----------------------------------------------------------
// Style cloning helper
//-----------------------------------------------------------

/**
 * Clone all <style> elements from the main document into a target
 * document, capturing rules added dynamically via insertRule()
 * (Monaco uses this for cursor, theme, and widget styles whose
 * textContent is empty).  Previous clones are removed first so
 * this function can be called repeatedly to re-sync.
 */
function syncStyleElements(targetDoc: Document): void {
    // Remove previously synced clones
    targetDoc
        .querySelectorAll<HTMLStyleElement>("style[data-pop-out-clone]")
        .forEach((el) => el.remove());

    document.querySelectorAll<HTMLStyleElement>("style").forEach((style) => {
        const clone = targetDoc.createElement("style");
        clone.setAttribute("data-pop-out-clone", "");
        if (style.media) clone.media = style.media;

        // Build CSS text from cssRules so we capture rules added via
        // insertRule() (whose textContent is empty).  We set textContent
        // on the clone instead of using insertRule because pop-out
        // windows (about:blank) may not expose clone.sheet immediately.
        let cssText = "";
        if (style.sheet) {
            try {
                const rules = style.sheet.cssRules;
                for (let i = 0; i < rules.length; i++) {
                    cssText += rules[i].cssText + "\n";
                }
            } catch {
                cssText = style.textContent || "";
            }
        } else {
            cssText = style.textContent || "";
        }

        clone.textContent = cssText;
        targetDoc.head.appendChild(clone);
    });
}

function cloneStyles(targetDoc: Document): Promise<void> {
    const linkPromises: Promise<void>[] = [];

    // Clone <link rel="stylesheet"> elements
    document.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']").forEach(
        (link) => {
            const clone = targetDoc.createElement("link");
            clone.rel = "stylesheet";
            clone.href = link.href;
            if (link.media) clone.media = link.media;
            linkPromises.push(
                new Promise((resolve) => {
                    clone.onload = () => resolve();
                    clone.onerror = () => resolve(); // don't block on failure
                })
            );
            targetDoc.head.appendChild(clone);
        }
    );

    // Clone <style> elements (initial sync)
    syncStyleElements(targetDoc);

    // Copy className from <html> (for Tailwind dark class)
    targetDoc.documentElement.className = document.documentElement.className;

    // Copy inline style (CSS custom properties / theme vars)
    targetDoc.documentElement.style.cssText =
        document.documentElement.style.cssText;

    return Promise.all(linkPromises).then(() => {});
}

//-----------------------------------------------------------
// Pop Out
//-----------------------------------------------------------

/**
 * Pop a panel out into a separate browser window.
 */
export function popOut(panelId: PanelId): void {
    // Guard: already popped out
    if (popOuts.has(panelId)) return;

    // Close fullscreen overlay if it's showing the same element we're about to pop out
    if ((panelId === "visualizer" || panelId === "canvas") && FullscreenOverlay.opened) {
        FullscreenOverlay.close();
    }

    const config = PANEL_CONFIGS[panelId];
    const element = document.getElementById(config.elementId);
    if (!element) return;

    const originalParent = element.parentElement;
    if (!originalParent) return;

    // Save current layout widths before collapsing
    const savedLayoutWidths = getAppColumnWidths();

    // Save the element's next sibling so we can restore DOM order
    const nextSibling = element.nextSibling;

    // Save whether the left panel is currently visible (for fileExplorer)
    const appLeft = document.getElementById("app-left");
    const wasLeftPanelOpen =
        panelId === "fileExplorer"
            ? !!(appLeft && !appLeft.classList.contains("hidden"))
            : false;

    // Open the pop-out window
    const { defaultWidth, defaultHeight } = config;
    const left = window.screenX + 100;
    const top = window.screenY + 100;
    const features =
        `width=${defaultWidth},height=${defaultHeight},left=${left},top=${top}`;
    const popOutWindow = window.open("", "", features);

    if (!popOutWindow) {
        Toast.error(
            "Pop-up blocked. Please allow pop-ups for this site."
        );
        return;
    }

    // Set up the pop-out document
    popOutWindow.document.title = `${config.title} \u2014 WebChucK IDE`;
    const stylesReady = cloneStyles(popOutWindow.document);

    // Body styles
    popOutWindow.document.body.style.margin = "0";
    popOutWindow.document.body.style.overflow = "hidden";

    // Create a wrapper div that fills the viewport
    const wrapper = popOutWindow.document.createElement("div");
    wrapper.style.width = "100vw";
    wrapper.style.height = "100vh";
    wrapper.style.backgroundColor = "var(--ide-bg, #fff)";
    wrapper.style.color = "var(--ide-text, #000)";
    wrapper.style.overflow = "auto";

    // If the element is hidden (e.g. an inactive output tab), reveal it
    // in the pop-out window. We'll restore the class on dock-back.
    const wasHidden = element.classList.contains("hidden");
    if (wasHidden) {
        element.classList.remove("hidden");
    }

    // Reparent the element into the pop-out wrapper
    wrapper.appendChild(element);
    popOutWindow.document.body.appendChild(wrapper);

    // beforeunload handler — auto re-dock when pop-out window closes
    const onBeforeUnload = () => {
        dockBack(panelId, false);
    };
    popOutWindow.addEventListener("beforeunload", onBeforeUnload);

    // resize handler — trigger resize on panel content
    popOutWindow.addEventListener("resize", () => {
        triggerResize(panelId);
    });

    // Register keyboard shortcuts that should work in the pop-out.
    if (panelId === "fileExplorer") {
        popOutWindow.document.addEventListener("keydown", (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "F") {
                e.preventDefault();
                FindInProject.toggle();
            }
        });
    }
    if (panelId === "editor") {
        popOutWindow.document.addEventListener("keydown", (e: KeyboardEvent) => {
            // Ctrl/Cmd + Shift + P — Command Palette
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "P") {
                e.preventDefault();
                Editor.openCommandPalette();
            }
            // Ctrl/Cmd + Shift + F — Find in Files
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "F") {
                e.preventDefault();
                FindInProject.toggle();
            }
        });
    }

    // Heartbeat: poll for pop-out window closure (beforeunload is unreliable)
    const heartbeat = setInterval(() => {
        const s = popOuts.get(panelId);
        if (!s || s.window.closed) {
            clearInterval(heartbeat);
            if (popOuts.has(panelId)) {
                dockBack(panelId, false);
            }
        }
    }, 500);

    // Save state into the registry
    popOuts.set(panelId, {
        window: popOutWindow,
        originalParent,
        reparentedElement: element,
        nextSibling,
        savedLayoutWidths,
        wasLeftPanelOpen,
        wasHidden,
        onBeforeUnload,
        heartbeat,
    });

    // Collapse the panel in the main window to reclaim space.
    // IMPORTANT: this must run BEFORE applying inline styles below,
    // because collapsePanel → OutputPanelHeader.updateOutputPanel()
    // clears inline heights on all output containers.
    collapsePanel(panelId);

    // Apply inline styles to guarantee correct dimensions in the
    // pop-out window. Placed AFTER collapsePanel() because
    // updateOutputPanel() clears inline heights on output containers.
    element.style.width = "100%";
    element.style.height = "100%";
    if (isOutputPanel(panelId)) {
        element.classList.add("pop-out-output");
    }

    // Wait for stylesheets to load in the pop-out window so that
    // CSS classes are applied before we measure dimensions.
    stylesReady.then(() => {
        popOutWindow.requestAnimationFrame(() => {
            triggerResize(panelId);
            // Monaco must be recreated after reparenting so its internal
            // DOM elements and event listeners bind to the new document.
            if (panelId === "editor") {
                Editor.recreateEditor();
                // Sync styles to capture <style> elements injected by
                // editor.create() into mainWindow.document.head
                syncStyleElements(popOutWindow.document);

                // One-time layout + focus after styles settle
                popOutWindow.requestAnimationFrame(() => {
                    if (!popOuts.has("editor")) return;
                    Editor.resizeEditor();
                    Editor.focusEditor();

                    // Continuous render pump — Monaco's View schedules
                    // its first rAF on the main window (where the DOM
                    // was created), not the pop-out window.
                    const renderPump = () => {
                        if (!popOuts.has("editor")) return;
                        Editor.forceRender();
                        popOutWindow.requestAnimationFrame(renderPump);
                    };
                    popOutWindow.requestAnimationFrame(renderPump);
                });
            }
        });
    });
}

//-----------------------------------------------------------
// Dock Back (internal)
//-----------------------------------------------------------

/**
 * Internal dock-back implementation.
 * @param panelId   Panel to dock back
 * @param closeWindow  Whether to close the pop-out window
 */
function dockBack(panelId: PanelId, closeWindow: boolean): void {
    const state = popOuts.get(panelId);
    if (!state) return;

    // Extract fields we need after deleting from the map
    const { savedLayoutWidths, wasLeftPanelOpen, wasHidden } = state;

    // Clear the heartbeat polling interval
    clearInterval(state.heartbeat);

    // Remove from map FIRST to prevent re-entrance from beforeunload
    popOuts.delete(panelId);

    // Remove the beforeunload listener from the pop-out window
    state.window.removeEventListener("beforeunload", state.onBeforeUnload);

    // Reparent element back to its original parent (preserve DOM order)
    try {
        state.originalParent.insertBefore(
            state.reparentedElement,
            state.nextSibling
        );
    } catch {
        state.originalParent.appendChild(state.reparentedElement);
    }

    // Restore the hidden class if the panel was hidden before pop-out
    if (wasHidden) {
        state.reparentedElement.classList.add("hidden");
    }

    // Remove inline styles added for pop-out
    state.reparentedElement.style.width = "";
    state.reparentedElement.style.height = "";
    state.reparentedElement.classList.remove("pop-out-output");

    // Restore the panel layout in the main window
    restorePanel(panelId, savedLayoutWidths, wasLeftPanelOpen);

    // Close the pop-out window if requested and not already closed
    if (closeWindow && !state.window.closed) {
        state.window.close();
    }

    // Trigger resize after layout settles
    requestAnimationFrame(() => {
        triggerResize(panelId);
        // Monaco must be recreated after reparenting so its internal
        // DOM elements and event listeners bind to the main document.
        if (panelId === "editor") {
            Editor.recreateEditor();
        }
    });
}

//-----------------------------------------------------------
// Query helpers
//-----------------------------------------------------------

/**
 * Check whether a panel is currently popped out.
 */
export function isPopOut(panelId: PanelId): boolean {
    return popOuts.has(panelId);
}

/**
 * Close all pop-out windows and dock everything back.
 */
export function closeAll(): void {
    for (const id of Array.from(popOuts.keys())) {
        dockBack(id, true);
    }
}

//-----------------------------------------------------------
// Output tab count helper
//-----------------------------------------------------------

function getActiveOutputTabCount(): number {
    let count = 0;
    for (const panelId of OUTPUT_PANEL_IDS) {
        const el = document.getElementById(PANEL_CONFIGS[panelId].elementId);
        if (el && !el.classList.contains("hidden") && !popOuts.has(panelId)) {
            count++;
        }
    }
    return count;
}

//-----------------------------------------------------------
// Layout helpers
//-----------------------------------------------------------

function resizeAllPanels(): void {
    Editor.resizeEditor();
    Console.resizeConsole();
    GUI.onResize();
}

//-----------------------------------------------------------
// Collapse / Restore helpers
//-----------------------------------------------------------

/**
 * Collapse (hide) a panel in the main window after it has been
 * popped out, reclaiming the space for other panels.
 */
function collapsePanel(panelId: PanelId): void {
    switch (panelId) {
        case "fileExplorer": {
            const appLeft = document.getElementById("app-left");
            // If the left panel is NOT hidden, toggle it to hide
            if (appLeft && !appLeft.classList.contains("hidden")) {
                toggleLeft();
            }
            break;
        }
        case "editor": {
            const appMiddle = document.getElementById("app-middle");
            const splitV2 = document.getElementById("splitV2");

            // Redistribute middle column width to left and right
            const widths = getAppColumnWidths();
            const halfMiddle = widths[1] / 2;
            setAppColumnWidths([
                widths[0] + halfMiddle,
                0,
                widths[2] + halfMiddle,
            ]);

            appMiddle?.classList.add("hidden");
            // Keep splitV1 visible as a resizer between file explorer and output
            splitV2?.classList.add("hidden");

            // Only deactivate splitV2; splitV1 remains active
            deactivateSplitter(2); // splitV2
            break;
        }
        case "console":
        case "vmMonitor":
        case "visualizer":
        case "canvas": {
            document.getElementById(OUTPUT_TAB_MAP[panelId])?.classList.add("hidden");
            OutputPanelHeader.updateOutputPanel(getActiveOutputTabCount());
            break;
        }
    }

    resizeAllPanels();
}

/**
 * Restore a panel in the main window after it has been docked back,
 * returning the layout to its saved widths.
 */
function restorePanel(
    panelId: PanelId,
    savedWidths: [number, number, number],
    wasLeftPanelOpen: boolean
): void {
    switch (panelId) {
        case "fileExplorer": {
            if (wasLeftPanelOpen) {
                const appLeft = document.getElementById("app-left");
                if (appLeft && appLeft.classList.contains("hidden")) {
                    toggleLeft();
                }
            }
            break;
        }
        case "editor": {
            const appMiddle = document.getElementById("app-middle");
            const splitV2 = document.getElementById("splitV2");

            appMiddle?.classList.remove("hidden");
            // splitV1 was kept visible — no need to unhide
            splitV2?.classList.remove("hidden");

            // Re-activate splitV2 (splitV1 was never deactivated)
            activateSplitter(2); // splitV2

            setAppColumnWidths(savedWidths);
            break;
        }
        case "console":
        case "vmMonitor":
        case "visualizer":
        case "canvas": {
            document.getElementById(OUTPUT_TAB_MAP[panelId])?.classList.remove("hidden");
            OutputPanelHeader.updateOutputPanel(getActiveOutputTabCount());
            break;
        }
    }

    resizeAllPanels();
}

//-----------------------------------------------------------
// Resize helper
//-----------------------------------------------------------

/**
 * Trigger resize on the content of a popped-out panel so that
 * editors, terminals, and canvases recalculate their dimensions.
 */
function triggerResize(panelId: PanelId): void {
    switch (panelId) {
        case "editor":
            Editor.resizeEditor();
            GUI.onResize();
            break;
        case "console":
            Console.resizeConsole();
            break;
        case "visualizer":
            visual?.resize();
            break;
    }
}

//-----------------------------------------------------------
// Theme sync
//-----------------------------------------------------------

/**
 * Synchronize the current theme (class + CSS custom properties)
 * from the main window to all open pop-out windows.
 */
export function syncThemeToPopOuts(): void {
    for (const [, state] of popOuts) {
        if (state.window.closed) continue;

        state.window.document.documentElement.className =
            document.documentElement.className;
        state.window.document.documentElement.style.cssText =
            document.documentElement.style.cssText;
    }
}
