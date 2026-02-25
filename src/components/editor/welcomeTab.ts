import { loadChuckFileFromURL, loadDataFileFromURL } from "@components/fileExplorer/projectSystem";
import InputPanelHeader from "@/components/inputPanel/inputPanelHeader";
import { engineMode } from "@/host";
import { setLoadedExample } from "@/components/suggestions";

interface WelcomeExample {
    title: string;
    description: string;
    blurb?: string;
    filename: string; // primary .ck filename for suggestion tracking
    load: () => void;
}

const WEBCHUCK_EXAMPLES: WelcomeExample[] = [
    {
        title: "Hello Sine",
        description: "Your first sound — a simple sine wave",
        blurb: "The simplest ChucK program: one line to make sound. This is where everyone starts.",
        filename: "helloSine.ck",
        load: () => loadChuckFileFromURL("examples/helloSine.ck"),
    },
    {
        title: "Play a Beat",
        description: "Load and loop a drum sample",
        blurb: "Load a .wav file and loop it with SndBuf — the foundation of sample-based music in ChucK.",
        filename: "slammin.ck",
        load: () => {
            loadChuckFileFromURL("examples/slammin/slammin.ck");
            loadDataFileFromURL("examples/slammin/were_slammin.wav");
        },
    },
    {
        title: "FM Synthesis GUI",
        description: "FM synthesis with interactive controls",
        blurb: "Tweak FM parameters in real time with auto-generated GUI sliders. See how carrier and modulator interact.",
        filename: "fmGUI.ck",
        load: () => {
            loadChuckFileFromURL("examples/fmGUI.ck");
            InputPanelHeader.setNotificationPing(0, true);
        },
    },
    {
        title: "On-the-Fly",
        description: "Live-code a beat, one shred at a time",
        blurb: "The classic ChucK demo: add instruments one at a time while the beat plays. This is on-the-fly programming.",
        filename: "otf_01.ck",
        load: () => {
            loadChuckFileFromURL("examples/otf/otf_01.ck");
            loadDataFileFromURL("examples/otf/data/kick.wav");
        },
    },
    {
        title: "Harmonic Series Arp",
        description: "Arpeggiate through the harmonic series",
        blurb: "Hear the natural overtone series — the building blocks of all musical timbre.",
        filename: "harmonicSeriesArp.ck",
        load: () => loadChuckFileFromURL("examples/harmonicSeriesArp.ck"),
    },
    {
        title: "Hello Sine GUI",
        description: "A sine wave with a frequency slider",
        blurb: "Your first interactive ChucK program — control a sine wave's frequency with a GUI slider.",
        filename: "helloSineGUI.ck",
        load: () => {
            loadChuckFileFromURL("examples/helloSineGUI.ck");
            InputPanelHeader.setNotificationPing(0, true);
        },
    },
    {
        title: "Mouse PWM HID",
        description: "Control sound with your mouse",
        blurb: "Move your mouse to change pitch and pulse width — your cursor becomes a musical controller.",
        filename: "mouseHID.ck",
        load: () => {
            loadChuckFileFromURL("examples/mouseHID.ck");
            InputPanelHeader.setNotificationPing(1, true);
        },
    },
    {
        title: "Keyboard Organ HID",
        description: "Play notes with your keyboard",
        blurb: "Turn your QWERTY keyboard into a musical instrument. Each key plays a different note.",
        filename: "keyboardHID.ck",
        load: () => {
            loadChuckFileFromURL("examples/keyboardHID.ck");
            InputPanelHeader.setNotificationPing(1, true);
        },
    },
];

const WEBCHUGL_EXAMPLES: WelcomeExample[] = [
    {
        title: "Basic Shapes",
        description: "3D primitives in a scene",
        blurb: "The 'Hello World' of ChuGL — cubes, spheres, and tori in a 3D scene.",
        filename: "basicShapes.ck",
        load: () => loadChuckFileFromURL("examples/chugl/basicShapes.ck"),
    },
    {
        title: "Circles",
        description: "Animated colorful circles",
        blurb: "Mesmerizing animated circles — audio-driven visuals at their simplest.",
        filename: "circles.ck",
        load: () => loadChuckFileFromURL("examples/chugl/circles.ck"),
    },
    {
        title: "Solar System",
        description: "Orbital scene graph hierarchy",
        blurb: "Planets orbiting a star — learn scene graph hierarchies through space.",
        filename: "solarSystem.ck",
        load: () => loadChuckFileFromURL("examples/chugl/solarSystem.ck"),
    },
    {
        title: "Lissajous",
        description: "Audio-visual oscilloscope",
        blurb: "Turn sound into art — watch oscillators trace beautiful Lissajous curves in real time.",
        filename: "lissajous.ck",
        load: () => loadChuckFileFromURL("examples/chugl/lissajous.ck"),
    },
];

// ---- Deterministic daily rotation helpers ----

function getDailySeed(): number {
    const now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function buildCard(ex: WelcomeExample, onClick: () => void): HTMLButtonElement {
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
    card.addEventListener("click", onClick);
    return card;
}

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

        // Deterministic daily shuffle
        const seed = getDailySeed();
        const rng = seededRandom(seed);
        const shuffled = seededShuffle(examples, rng);
        const featured = shuffled[0];
        const gridExamples = shuffled.slice(1, 5);

        // Header
        const header = document.createElement("div");
        header.className = "text-center mb-6";
        header.innerHTML = `
            <img src="img/ChonK.svg" alt="ChucK Logo" class="h-16 mx-auto mb-3" />
            <h2 class="text-2xl font-bold text-dark dark:text-light">Welcome to ${isChuGL ? "WebChuGL" : "WebChucK"} IDE</h2>
            <p class="text-sm text-dark-5 dark:text-dark-a mt-1">Pick an example to get started</p>
        `;
        overlay.appendChild(header);

        // Featured "Example of the Day"
        const featuredCard = document.createElement("button");
        featuredCard.type = "button";
        featuredCard.className = [
            "text-left p-4 rounded-lg border-2 border-orange",
            "hover:shadow-md transition cursor-pointer bg-transparent",
            "max-w-md w-full mb-4",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange",
        ].join(" ");
        featuredCard.innerHTML = `
            <div class="text-xs font-semibold text-dark-5 dark:text-dark-a uppercase tracking-wide mb-1">Example of the Day</div>
            <div class="font-bold text-orange text-base">${featured.title}</div>
            <div class="text-xs text-dark-5 dark:text-dark-a mt-1">${featured.blurb || featured.description}</div>
        `;
        featuredCard.addEventListener("click", () => {
            setLoadedExample(featured.filename);
            featured.load();
            WelcomeTab.dismiss();
        });
        overlay.appendChild(featuredCard);

        // "Surprise Me" button
        const surpriseBtn = document.createElement("button");
        surpriseBtn.type = "button";
        surpriseBtn.className = [
            "mb-4 px-4 py-2 rounded-lg",
            "bg-orange text-white font-semibold text-sm",
            "hover:bg-orange-dark transition cursor-pointer",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange",
        ].join(" ");
        surpriseBtn.textContent = "\uD83C\uDFB2 Surprise Me";
        surpriseBtn.addEventListener("click", () => {
            const random = examples[Math.floor(Math.random() * examples.length)];
            setLoadedExample(random.filename);
            random.load();
            WelcomeTab.dismiss();
        });
        overlay.appendChild(surpriseBtn);

        // Rotating example grid (seeded by date)
        const grid = document.createElement("div");
        grid.className = "grid grid-cols-2 gap-3 max-w-md w-full mb-6";

        for (const ex of gridExamples) {
            grid.appendChild(buildCard(ex, () => {
                setLoadedExample(ex.filename);
                ex.load();
                WelcomeTab.dismiss();
            }));
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
