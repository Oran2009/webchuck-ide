import { toggleLeft } from "@utils/appLayout";
import SVGToggle from "@components/toggle/svgToggle";
import BottomSheet from "@components/mobile/bottomSheet";

/**
 * Editor Header class
 * @param fileToggle The file toggle button
 * @param filenameElement Display file name being edited
 */
export default class EditorPanelHeader {
    public static fileToggle: HTMLButtonElement;
    public static filenameElement: HTMLDivElement;
    private static fileToggleSVG: SVGToggle;

    constructor() {
        EditorPanelHeader.fileToggle =
            document.querySelector<HTMLButtonElement>("#fileToggle")!;
        EditorPanelHeader.filenameElement =
            document.querySelector<HTMLDivElement>("#filename")!;

        // Build SVG Folder Toggle
        EditorPanelHeader.fileToggleSVG = new SVGToggle(
            EditorPanelHeader.fileToggle,
            () => {
                if (window.matchMedia("(max-width: 640px)").matches) {
                    BottomSheet.open();
                } else {
                    toggleLeft();
                }
            },
            false
        );

        // On mobile, file explorer starts closed — icon should be gray
        if (window.matchMedia("(max-width: 640px)").matches) {
            EditorPanelHeader.fileToggleSVG.activate();
        }

        // When bottom sheet closes, set icon back to gray (closed)
        document.addEventListener("bottomsheet:close", () => {
            EditorPanelHeader.fileToggleSVG.activate();
        });
    }

    static updateFileName(filename: string) {
        EditorPanelHeader.filenameElement.innerText = filename;
    }
}
