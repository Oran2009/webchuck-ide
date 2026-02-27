//-----------------------------------------------------------
// title: PopOutManager
// desc:  Manages popping IDE panels out into separate browser
//        windows and docking them back. Each panel is reparented
//        into a new window with cloned styles, and restored to
//        its original parent on dock-back or window close.
//
// author: terry feng
// date:   February 2026
//-----------------------------------------------------------

import Editor from "@/components/editor/monaco/editor";
import Console from "@/components/outputPanel/console";
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
// Registry of active pop-outs
//-----------------------------------------------------------

const popOuts = new Map<PanelId, PopOutState>();

//-----------------------------------------------------------
// Style cloning helper
//-----------------------------------------------------------

/**
 * Clone all stylesheets and inline styles from the main document
 * into the target document so the reparented element looks correct.
 */
function cloneStyles(targetDoc: Document): void {
    // Clone <link rel="stylesheet"> elements
    document.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']").forEach(
        (link) => {
            const clone = targetDoc.createElement("link");
            clone.rel = "stylesheet";
            clone.href = link.href;
            if (link.media) clone.media = link.media;
            targetDoc.head.appendChild(clone);
        }
    );

    // Clone <style> elements
    document.querySelectorAll<HTMLStyleElement>("style").forEach((style) => {
        const clone = targetDoc.createElement("style");
        clone.textContent = style.textContent;
        targetDoc.head.appendChild(clone);
    });

    // Copy className from <html> (for Tailwind dark class)
    targetDoc.documentElement.className = document.documentElement.className;

    // Copy inline style (CSS custom properties / theme vars)
    targetDoc.documentElement.style.cssText =
        document.documentElement.style.cssText;
}

//-----------------------------------------------------------
// Dock-back button SVG (arrow-down-left icon)
//-----------------------------------------------------------

const DOCK_BACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><polyline points="15 18 6 18 6 9"></polyline></svg>`;

//-----------------------------------------------------------
// Pop Out
//-----------------------------------------------------------

/**
 * Pop a panel out into a separate browser window.
 */
export function popOut(panelId: PanelId): void {
    // Guard: already popped out
    if (popOuts.has(panelId)) return;

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
    cloneStyles(popOutWindow.document);

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

    // Create dock-back button (fixed, top-right corner)
    const dockBtn = popOutWindow.document.createElement("button");
    dockBtn.innerHTML = DOCK_BACK_SVG;
    dockBtn.title = "Dock back to main window";
    dockBtn.style.position = "fixed";
    dockBtn.style.top = "8px";
    dockBtn.style.right = "8px";
    dockBtn.style.zIndex = "9999";
    dockBtn.style.background = "none";
    dockBtn.style.border = "none";
    dockBtn.style.cursor = "pointer";
    dockBtn.style.color = "inherit";
    dockBtn.style.opacity = "0.6";
    dockBtn.style.padding = "4px";
    dockBtn.style.borderRadius = "4px";
    dockBtn.style.display = "flex";
    dockBtn.style.alignItems = "center";
    dockBtn.style.justifyContent = "center";
    dockBtn.addEventListener("mouseenter", () => {
        dockBtn.style.opacity = "1";
    });
    dockBtn.addEventListener("mouseleave", () => {
        dockBtn.style.opacity = "0.6";
    });
    dockBtn.addEventListener("click", () => {
        dockBack(panelId);
    });

    // Reparent the element into the pop-out wrapper
    wrapper.appendChild(dockBtn);
    wrapper.appendChild(element);
    popOutWindow.document.body.appendChild(wrapper);

    // beforeunload handler — auto re-dock when pop-out window closes
    const onBeforeUnload = () => {
        dockBackInternal(panelId, false);
    };
    popOutWindow.addEventListener("beforeunload", onBeforeUnload);

    // resize handler — trigger resize on panel content
    popOutWindow.addEventListener("resize", () => {
        triggerResize(panelId);
    });

    // Heartbeat: poll for pop-out window closure (beforeunload is unreliable)
    const heartbeat = setInterval(() => {
        const s = popOuts.get(panelId);
        if (!s || s.window.closed) {
            clearInterval(heartbeat);
            if (popOuts.has(panelId)) {
                dockBackInternal(panelId, false);
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
        onBeforeUnload,
        heartbeat,
    });

    // Collapse the panel in the main window to reclaim space
    collapsePanel(panelId);

    // Trigger resize in the pop-out after layout settles
    requestAnimationFrame(() => {
        triggerResize(panelId);
        // Monaco needs font remeasure after reparenting to a new document
        if (panelId === "editor") {
            import("monaco-editor").then((monaco) => {
                monaco.editor.remeasureFonts();
            });
        }
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
function dockBackInternal(panelId: PanelId, closeWindow: boolean): void {
    const state = popOuts.get(panelId);
    if (!state) return;

    // Extract fields we need after deleting from the map
    const { savedLayoutWidths, wasLeftPanelOpen } = state;

    // Clear the heartbeat polling interval
    clearInterval(state.heartbeat);

    // Remove from map FIRST to prevent re-entrance from beforeunload
    popOuts.delete(panelId);

    // Remove the beforeunload listener from the pop-out window
    state.window.removeEventListener("beforeunload", state.onBeforeUnload);

    // Reparent element back to its original parent (preserve DOM order)
    state.originalParent.insertBefore(
        state.reparentedElement,
        state.nextSibling
    );

    // Restore the panel layout in the main window
    restorePanel(panelId, savedLayoutWidths, wasLeftPanelOpen);

    // Close the pop-out window if requested and not already closed
    if (closeWindow && !state.window.closed) {
        state.window.close();
    }

    // Trigger resize after layout settles
    requestAnimationFrame(() => {
        triggerResize(panelId);
        // Monaco needs font remeasure after reparenting to a new document
        if (panelId === "editor") {
            import("monaco-editor").then((monaco) => {
                monaco.editor.remeasureFonts();
            });
        }
    });
}

//-----------------------------------------------------------
// Dock Back (exported)
//-----------------------------------------------------------

/**
 * Dock a popped-out panel back into the main window and close
 * the pop-out window.
 */
export function dockBack(panelId: PanelId): void {
    dockBackInternal(panelId, true);
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
        dockBackInternal(id, true);
    }
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
            const splitV1 = document.getElementById("splitV1");
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
            splitV1?.classList.add("hidden");
            splitV2?.classList.add("hidden");

            // Deactivate splitters flanking the editor column
            deactivateSplitter(0); // splitV1
            deactivateSplitter(2); // splitV2
            break;
        }
        case "console": {
            document.getElementById("consoleTab")?.classList.add("hidden");
            break;
        }
        case "vmMonitor": {
            document.getElementById("vmMonitorTab")?.classList.add("hidden");
            break;
        }
        case "visualizer": {
            document.getElementById("visualizerTab")?.classList.add("hidden");
            // Hide fullscreen button if canvas is also popped out
            if (isPopOut("canvas")) {
                OutputPanelHeader.fullscreenButton?.classList.add("hidden");
            }
            break;
        }
        case "canvas": {
            document.getElementById("canvasTab")?.classList.add("hidden");
            // Hide fullscreen button if visualizer is also popped out
            if (isPopOut("visualizer")) {
                OutputPanelHeader.fullscreenButton?.classList.add("hidden");
            }
            break;
        }
    }

    Editor.resizeEditor();
    Console.resizeConsole();
    GUI.onResize();
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
            const splitV1 = document.getElementById("splitV1");
            const splitV2 = document.getElementById("splitV2");

            appMiddle?.classList.remove("hidden");
            splitV1?.classList.remove("hidden");
            splitV2?.classList.remove("hidden");

            // Re-activate splitters flanking the editor column
            activateSplitter(0); // splitV1
            activateSplitter(2); // splitV2

            setAppColumnWidths(savedWidths);
            break;
        }
        case "console": {
            document
                .getElementById("consoleTab")
                ?.classList.remove("hidden");
            break;
        }
        case "vmMonitor": {
            document
                .getElementById("vmMonitorTab")
                ?.classList.remove("hidden");
            break;
        }
        case "visualizer": {
            document
                .getElementById("visualizerTab")
                ?.classList.remove("hidden");
            OutputPanelHeader.fullscreenButton?.classList.remove("hidden");
            break;
        }
        case "canvas": {
            document
                .getElementById("canvasTab")
                ?.classList.remove("hidden");
            OutputPanelHeader.fullscreenButton?.classList.remove("hidden");
            break;
        }
    }

    Editor.resizeEditor();
    Console.resizeConsole();
    GUI.onResize();
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
