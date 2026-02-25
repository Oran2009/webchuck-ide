import { loadChuckFileFromURL, loadDataFileFromURL } from "@components/fileExplorer/projectSystem";
import InputPanelHeader from "@/components/inputPanel/inputPanelHeader";
import { engineMode } from "@/host";

interface WelcomeExample {
    title: string;
    description: string;
    load: () => void;
}

const WEBCHUCK_EXAMPLES: WelcomeExample[] = [
    {
        title: "Hello Sine",
        description: "Your first sound — a simple sine wave",
        load: () => loadChuckFileFromURL("examples/helloSine.ck"),
    },
    {
        title: "Play a Beat",
        description: "Load and loop a drum sample",
        load: () => {
            loadChuckFileFromURL("examples/slammin/slammin.ck");
            loadDataFileFromURL("examples/slammin/were_slammin.wav");
        },
    },
    {
        title: "FM Synthesis GUI",
        description: "FM synthesis with interactive controls",
        load: () => {
            loadChuckFileFromURL("examples/fmGUI.ck");
            InputPanelHeader.setNotificationPing(0, true);
        },
    },
    {
        title: "On-the-Fly",
        description: "Live-code a beat, one shred at a time",
        load: () => {
            loadChuckFileFromURL("examples/otf/otf_01.ck");
            loadDataFileFromURL("examples/otf/data/kick.wav");
        },
    },
];

const WEBCHUGL_EXAMPLES: WelcomeExample[] = [
    {
        title: "Basic Shapes",
        description: "3D primitives in a scene",
        load: () => loadChuckFileFromURL("examples/chugl/basicShapes.ck"),
    },
    {
        title: "Circles",
        description: "Animated colorful circles",
        load: () => loadChuckFileFromURL("examples/chugl/circles.ck"),
    },
    {
        title: "Solar System",
        description: "Orbital scene graph hierarchy",
        load: () => loadChuckFileFromURL("examples/chugl/solarSystem.ck"),
    },
    {
        title: "Lissajous",
        description: "Audio-visual oscilloscope",
        load: () => loadChuckFileFromURL("examples/chugl/lissajous.ck"),
    },
];

export default class WelcomeTab {
    private static overlay: HTMLDivElement | null = null;

    /**
     * Show the welcome overlay inside the editor panel.
     * Call dismiss() or click any example to remove it.
     */
    static show(editorPanel: HTMLElement) {
        if (WelcomeTab.overlay) return;

        const overlay = document.createElement("div");
        overlay.id = "welcomeOverlay";
        overlay.className = [
            "absolute inset-0 z-10 flex flex-col items-center justify-center",
            "overflow-auto p-6",
        ].join(" ");
        overlay.style.top = "2rem"; // below editor header
        overlay.style.backgroundColor = "var(--ide-editor-bg, #FEFEFF)";

        const isChuGL = engineMode === "webchugl";
        const examples = isChuGL ? WEBCHUGL_EXAMPLES : WEBCHUCK_EXAMPLES;

        // Header
        const header = document.createElement("div");
        header.className = "text-center mb-6";
        header.innerHTML = `
            <img src="img/ChonK.svg" alt="ChucK Logo" class="h-16 mx-auto mb-3" />
            <h2 class="text-2xl font-bold text-dark dark:text-light">Welcome to ${isChuGL ? "WebChuGL" : "WebChucK"} IDE</h2>
            <p class="text-sm text-dark-5 dark:text-dark-a mt-1">Pick an example to get started</p>
        `;
        overlay.appendChild(header);

        // Example cards grid
        const grid = document.createElement("div");
        grid.className = "grid grid-cols-2 gap-3 max-w-md w-full mb-6";

        for (const ex of examples) {
            const card = document.createElement("button");
            card.type = "button";
            card.className = [
                "text-left p-3 rounded-lg border border-gray-200 dark:border-dark-5",
                "hover:border-orange dark:hover:border-orange hover:shadow-sm",
                "transition cursor-pointer bg-transparent",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange",
            ].join(" ");
            card.innerHTML = `
                <div class="font-semibold text-orange text-sm">${ex.title}</div>
                <div class="text-xs text-dark-5 dark:text-dark-a mt-0.5">${ex.description}</div>
            `;
            card.addEventListener("click", () => {
                ex.load();
                WelcomeTab.dismiss();
            });
            grid.appendChild(card);
        }
        overlay.appendChild(grid);

        // Blank file button
        const blank = document.createElement("button");
        blank.type = "button";
        blank.className = [
            "mb-6 text-sm text-dark-5 dark:text-dark-a",
            "hover:text-orange transition cursor-pointer",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange",
            "bg-transparent border-none underline underline-offset-2",
        ].join(" ");
        blank.textContent = "or start with a blank file";
        blank.addEventListener("click", () => WelcomeTab.dismiss());
        overlay.appendChild(blank);

        // Quick links
        const links = document.createElement("div");
        links.className = "flex gap-4 text-xs text-dark-5 dark:text-dark-a";
        links.innerHTML = `
            <a href="https://chuck.stanford.edu/doc/reference" target="_blank" rel="noopener noreferrer" class="hover:text-orange transition">ChucK Docs</a>
            <a href="https://chuck.stanford.edu/webchuck/" target="_blank" rel="noopener noreferrer" class="hover:text-orange transition">Learn WebChucK</a>
            <a href="https://discord.gg/ENr3nurrx8" target="_blank" rel="noopener noreferrer" class="hover:text-orange transition">Discord</a>
        `;
        overlay.appendChild(links);

        editorPanel.appendChild(overlay);
        WelcomeTab.overlay = overlay;
    }

    /**
     * Remove the welcome overlay
     */
    static dismiss() {
        if (WelcomeTab.overlay) {
            WelcomeTab.overlay.remove();
            WelcomeTab.overlay = null;
        }
    }

    /**
     * Whether the welcome overlay is currently visible
     */
    static isVisible(): boolean {
        return WelcomeTab.overlay !== null;
    }
}
