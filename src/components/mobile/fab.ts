//-----------------------------------------------------------
// title: FAB (Floating Action Button)
// desc:  Mobile floating action button for ChucK controls.
//        Primary button runs code, long-press expands
//        sub-menu with Replace and Remove actions.
//-----------------------------------------------------------

import ChuckBar from "@/components/chuckBar/chuckBar";

const LONG_PRESS_MS = 500;

export default class FAB {
    private static menu: HTMLDivElement;
    private static playButton: HTMLButtonElement;
    private static replaceButton: HTMLButtonElement;
    private static removeButton: HTMLButtonElement;
    private static isExpanded: boolean = false;
    private static pressTimer: ReturnType<typeof setTimeout> | null = null;
    private static didLongPress: boolean = false;

    constructor() {
        FAB.menu =
            document.querySelector<HTMLDivElement>("#fabMenu")!;
        FAB.playButton =
            document.querySelector<HTMLButtonElement>("#fabPlay")!;
        FAB.replaceButton =
            document.querySelector<HTMLButtonElement>("#fabReplace")!;
        FAB.removeButton =
            document.querySelector<HTMLButtonElement>("#fabRemove")!;

        // Primary button: tap = run code
        FAB.playButton.addEventListener("click", () => {
            if (FAB.didLongPress) {
                FAB.didLongPress = false;
                return;
            }
            if (ChuckBar.running) {
                ChuckBar.runEditorCode();
            }
        });

        // Long press to expand the sub-menu
        FAB.playButton.addEventListener(
            "touchstart",
            () => {
                FAB.didLongPress = false;
                FAB.pressTimer = setTimeout(() => {
                    FAB.didLongPress = true;
                    FAB.toggleMenu();
                    FAB.pressTimer = null;
                }, LONG_PRESS_MS);
            },
            { passive: true }
        );
        FAB.playButton.addEventListener("touchend", () => {
            if (FAB.pressTimer) {
                clearTimeout(FAB.pressTimer);
                FAB.pressTimer = null;
            }
        });
        FAB.playButton.addEventListener("touchmove", () => {
            if (FAB.pressTimer) {
                clearTimeout(FAB.pressTimer);
                FAB.pressTimer = null;
            }
        });

        // Sub-buttons
        FAB.replaceButton.addEventListener("click", () => {
            ChuckBar.replaceCode();
            FAB.hideMenu();
        });
        FAB.removeButton.addEventListener("click", () => {
            ChuckBar.removeCode();
            FAB.hideMenu();
        });

        // Close menu on tap outside
        document.addEventListener("click", (e) => {
            const fab = document.querySelector<HTMLDivElement>("#fab")!;
            if (FAB.isExpanded && !fab.contains(e.target as Node)) {
                FAB.hideMenu();
            }
        });
    }

    static toggleMenu(): void {
        if (FAB.isExpanded) {
            FAB.hideMenu();
        } else {
            FAB.showMenu();
        }
    }

    static showMenu(): void {
        FAB.menu.classList.remove("hidden");
        FAB.isExpanded = true;
    }

    static hideMenu(): void {
        FAB.menu.classList.add("hidden");
        FAB.isExpanded = false;
    }

    /** Enable FAB buttons when ChucK is running */
    static enable(): void {
        FAB.playButton.disabled = false;
        FAB.replaceButton.disabled = false;
        FAB.removeButton.disabled = false;
    }

    /** Disable FAB buttons when ChucK is reset */
    static disable(): void {
        FAB.playButton.disabled = true;
        FAB.replaceButton.disabled = true;
        FAB.removeButton.disabled = true;
        FAB.hideMenu();
    }
}
