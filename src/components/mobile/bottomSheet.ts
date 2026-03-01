//-----------------------------------------------------------
// title: BottomSheet
// desc:  Mobile bottom sheet for file explorer access.
//        Slides up from the bottom on mobile devices.
//-----------------------------------------------------------

const SWIPE_THRESHOLD = 80; // px to trigger dismiss

export default class BottomSheet {
    private static overlay: HTMLDivElement;
    private static content: HTMLDivElement;
    private static backdrop: HTMLDivElement;
    private static filesContainer: HTMLDivElement;
    private static isOpen: boolean = false;
    private static startY: number = 0;
    private static currentY: number = 0;

    /** Original parent of the file explorer panel, for reparenting back */
    private static fileExplorerPanel: HTMLDivElement;
    private static originalParent: HTMLElement;

    constructor() {
        BottomSheet.overlay =
            document.querySelector<HTMLDivElement>("#bottomSheet")!;
        BottomSheet.content =
            document.querySelector<HTMLDivElement>("#bottomSheetContent")!;
        BottomSheet.backdrop =
            document.querySelector<HTMLDivElement>("#bottomSheetBackdrop")!;
        BottomSheet.filesContainer =
            document.querySelector<HTMLDivElement>("#bottomSheetFiles")!;
        BottomSheet.fileExplorerPanel =
            document.querySelector<HTMLDivElement>("#fileExplorerPanel")!;
        BottomSheet.originalParent =
            BottomSheet.fileExplorerPanel.parentElement!;

        // Close button
        document
            .querySelector<HTMLButtonElement>("#bottomSheetClose")!
            .addEventListener("click", () => {
                BottomSheet.close();
            });

        // Backdrop tap to close
        BottomSheet.backdrop.addEventListener("click", () => {
            BottomSheet.close();
        });

        // Swipe-to-dismiss on the content area
        BottomSheet.content.addEventListener(
            "touchstart",
            BottomSheet.onTouchStart,
            { passive: true }
        );
        BottomSheet.content.addEventListener(
            "touchmove",
            BottomSheet.onTouchMove,
            { passive: false }
        );
        BottomSheet.content.addEventListener(
            "touchend",
            BottomSheet.onTouchEnd
        );
    }

    static open(): void {
        if (BottomSheet.isOpen) return;

        // Reparent entire file explorer panel (header + tree + search) into bottom sheet
        BottomSheet.filesContainer.appendChild(BottomSheet.fileExplorerPanel);

        BottomSheet.overlay.classList.remove("hidden");
        BottomSheet.content.classList.remove("closing");
        BottomSheet.isOpen = true;
    }

    static close(): void {
        if (!BottomSheet.isOpen) return;

        BottomSheet.content.classList.add("closing");
        BottomSheet.content.style.transform = "";

        const onAnimEnd = () => {
            BottomSheet.content.removeEventListener("animationend", onAnimEnd);
            BottomSheet.overlay.classList.add("hidden");
            BottomSheet.content.classList.remove("closing");

            // Reparent file explorer panel back to original location
            BottomSheet.originalParent.appendChild(
                BottomSheet.fileExplorerPanel
            );
            BottomSheet.isOpen = false;

            // Notify toggle icon to reset
            document.dispatchEvent(new Event("bottomsheet:close"));
        };
        BottomSheet.content.addEventListener("animationend", onAnimEnd);
    }

    // ----- Touch handling for swipe-to-dismiss -----

    private static onTouchStart(e: TouchEvent): void {
        BottomSheet.startY = e.touches[0].clientY;
        BottomSheet.currentY = BottomSheet.startY;
    }

    private static onTouchMove(e: TouchEvent): void {
        BottomSheet.currentY = e.touches[0].clientY;
        const deltaY = BottomSheet.currentY - BottomSheet.startY;

        // Only allow dragging downward
        if (deltaY > 0) {
            e.preventDefault();
            BottomSheet.content.style.transform = `translateY(${deltaY}px)`;
        }
    }

    private static onTouchEnd(): void {
        const deltaY = BottomSheet.currentY - BottomSheet.startY;

        if (deltaY > SWIPE_THRESHOLD) {
            BottomSheet.close();
        } else {
            // Snap back
            BottomSheet.content.style.transform = "";
        }
    }
}
