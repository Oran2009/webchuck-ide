import { loadChuckFileFromURL, loadDataFileFromURL } from "@components/fileExplorer/projectSystem";
import ProjectSystem from "@components/fileExplorer/projectSystem";
import InputPanelHeader from "@/components/inputPanel/inputPanelHeader";
import { engineMode } from "@/host";
import {
    fetchTextFile,
    fetchDataFile,
    isPlaintextFile,
} from "@/utils/fileLoader";

interface WelcomeExample {
    title: string;
    icon: string; // emoji shown on welcome cards
    description: string;
    blurb?: string;
    filename: string; // primary .ck filename for suggestion tracking
    load: () => void;
}

// ---- Handcrafted examples (curated icons, blurbs, special load logic) ----

const WEBCHUCK_EXAMPLES: WelcomeExample[] = [
    {
        title: "Hello Sine",
        icon: "\uD83C\uDFB5",
        description: "Your first sound — a simple sine wave",
        blurb: "The simplest ChucK program: one line to make sound. This is where everyone starts.",
        filename: "helloSine.ck",
        load: () => loadChuckFileFromURL("examples/helloSine.ck"),
    },
    {
        title: "Play a Beat",
        icon: "\uD83E\uDD41",
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
        icon: "\uD83C\uDF9B\uFE0F",
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
        icon: "\u26A1",
        description: "Live-code a beat, one shred at a time",
        blurb: "The classic ChucK demo: add instruments one at a time while the beat plays. This is on-the-fly programming.",
        filename: "otf_01.ck",
        load: () => {
            loadChuckFileFromURL("examples/otf/otf_01.ck");
            loadDataFileFromURL("examples/otf/data/kick.wav");
        },
    },
    {
        title: "OTF: Hi-Hat",
        icon: "\u26A1",
        description: "Add a hi-hat to the beat",
        blurb: "Layer a hi-hat on top of the kick — on-the-fly programming, one shred at a time.",
        filename: "otf_02.ck",
        load: () => {
            loadChuckFileFromURL("examples/otf/otf_02.ck");
            loadDataFileFromURL("examples/otf/data/hihat.wav");
        },
    },
    {
        title: "OTF: Open Hi-Hat",
        icon: "\u26A1",
        description: "Add an open hi-hat layer",
        blurb: "Keep building the beat — add an open hi-hat for more groove.",
        filename: "otf_03.ck",
        load: () => {
            loadChuckFileFromURL("examples/otf/otf_03.ck");
            loadDataFileFromURL("examples/otf/data/hihat-open.wav");
        },
    },
    {
        title: "OTF: Snare",
        icon: "\u26A1",
        description: "Drop in a snare pattern",
        blurb: "The snare hits — now the beat is really coming together.",
        filename: "otf_04.ck",
        load: () => {
            loadChuckFileFromURL("examples/otf/otf_04.ck");
            loadDataFileFromURL("examples/otf/data/snare-hop.wav");
        },
    },
    {
        title: "OTF: Synth Bass",
        icon: "\u26A1",
        description: "Add a synthesized bass line",
        blurb: "No samples needed — synthesize a bass line from pure oscillators.",
        filename: "otf_05.ck",
        load: () => {
            loadChuckFileFromURL("examples/otf/otf_05.ck");
        },
    },
    {
        title: "OTF: Melody",
        icon: "\u26A1",
        description: "Layer a melodic line on top",
        blurb: "Add a melody over the rhythm — the beat becomes a song.",
        filename: "otf_06.ck",
        load: () => {
            loadChuckFileFromURL("examples/otf/otf_06.ck");
        },
    },
    {
        title: "OTF: Snare Roll",
        icon: "\u26A1",
        description: "Finish with a snare roll",
        blurb: "The final layer — a snare roll to complete the on-the-fly demo.",
        filename: "otf_07.ck",
        load: () => {
            loadChuckFileFromURL("examples/otf/otf_07.ck");
            loadDataFileFromURL("examples/otf/data/snare.wav");
        },
    },
    {
        title: "Harmonic Series Arp",
        icon: "\uD83C\uDFB6",
        description: "Arpeggiate through the harmonic series",
        blurb: "Hear the natural overtone series — the building blocks of all musical timbre.",
        filename: "harmonicSeriesArp.ck",
        load: () => loadChuckFileFromURL("examples/harmonicSeriesArp.ck"),
    },
    {
        title: "Hello Sine GUI",
        icon: "\uD83D\uDD0A",
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
        icon: "\uD83D\uDDB1\uFE0F",
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
        icon: "\uD83C\uDFB9",
        description: "Play notes with your keyboard",
        blurb: "Turn your QWERTY keyboard into a musical instrument. Each key plays a different note.",
        filename: "keyboardHID.ck",
        load: () => {
            loadChuckFileFromURL("examples/keyboardHID.ck");
            InputPanelHeader.setNotificationPing(1, true);
        },
    },
    {
        title: "Gyro Demo",
        icon: "\uD83D\uDCF1",
        description: "Tilt your phone to make sound",
        blurb: "Use your device's gyroscope as a musical controller — tilt to change the sound.",
        filename: "gyroDemo.ck",
        load: () => {
            loadChuckFileFromURL("examples/gyro/gyroDemo.ck");
            loadDataFileFromURL("examples/gyro/gyroLoop.wav");
            InputPanelHeader.setNotificationPing(2, true);
        },
    },
    {
        title: "Accel Demo",
        icon: "\uD83C\uDFC3",
        description: "Shake your device to make sound",
        blurb: "Use your device's accelerometer to control sound — motion becomes music.",
        filename: "accelDemo.ck",
        load: () => {
            loadChuckFileFromURL("examples/accelDemo.ck");
            InputPanelHeader.setNotificationPing(2, true);
        },
    },
];

const WEBCHUGL_EXAMPLES: WelcomeExample[] = [
    {
        title: "Basic Shapes",
        icon: "\uD83D\uDFE9",
        description: "3D primitives in a scene",
        blurb: "The 'Hello World' of ChuGL — cubes, spheres, and tori in a 3D scene.",
        filename: "basicShapes.ck",
        load: () => loadChuckFileFromURL("examples/chugl/basicShapes.ck"),
    },
    {
        title: "Circles",
        icon: "\uD83D\uDD35",
        description: "Animated colorful circles",
        blurb: "Mesmerizing animated circles — audio-driven visuals at their simplest.",
        filename: "circles.ck",
        load: () => loadChuckFileFromURL("examples/chugl/circles.ck"),
    },
    {
        title: "Solar System",
        icon: "\uD83E\uDE90",
        description: "Orbital scene graph hierarchy",
        blurb: "Planets orbiting a star — learn scene graph hierarchies through space.",
        filename: "solarSystem.ck",
        load: () => loadChuckFileFromURL("examples/chugl/solarSystem.ck"),
    },
    {
        title: "Lissajous",
        icon: "\uD83C\uDF00",
        description: "Audio-visual oscilloscope",
        blurb: "Turn sound into art — watch oscillators trace beautiful Lissajous curves in real time.",
        filename: "lissajous.ck",
        load: () => loadChuckFileFromURL("examples/chugl/lissajous.ck"),
    },
    {
        title: "JS Freq Control",
        icon: "\u2699\uFE0F",
        description: "Control ChuGL from JavaScript",
        blurb: "Bridge ChucK and JavaScript — control a frequency parameter from the host page.",
        filename: "jsFreqControl.ck",
        load: () => {
            loadChuckFileFromURL("examples/chugl/jsFreqControl.ck");
            loadChuckFileFromURL("examples/chugl/jsFreqControl.js");
        },
    },
    {
        title: "JS Scene Builder",
        icon: "\uD83C\uDFD7\uFE0F",
        description: "Build a 3D scene from JavaScript",
        blurb: "Create and manipulate a ChuGL scene entirely from JavaScript — no ChucK code needed.",
        filename: "jsSceneBuilder.js",
        load: () => {
            loadChuckFileFromURL("examples/chugl/jsSceneBuilder.js");
        },
    },
];

// ---- More Examples JSON integration ----

interface MoreExampleEntry {
    name: string;
    code: string;
    data: string[];
}

interface MoreExamplesJSON {
    [folder: string]: Array<string | Record<string, MoreExampleEntry>>;
}

/** Map folder names to category icons for More Examples */
const FOLDER_ICONS: Record<string, string> = {
    examples: "\uD83D\uDCC4",
    basic: "\uD83C\uDFB5",
    deep: "\uD83D\uDD2C",
    extend: "\uD83D\uDD27",
    stk: "\uD83C\uDFBB",
    analysis: "\uD83D\uDCCA",
    array: "\uD83D\uDCCB",
    ctrl: "\uD83C\uDFAE",
    multi: "\uD83E\uDDF5",
    io: "\uD83D\uDCC2",
    math: "\uD83D\uDD22",
    time: "\u23F1\uFE0F",
    special: "\u2728",
    type: "\uD83D\uDCDD",
    ai: "\uD83E\uDD16",
    machine: "\u2699\uFE0F",
    class: "\uD83C\uDFD7\uFE0F",
    shred: "\uD83E\uDDF6",
    string: "\uD83D\uDCDC",
    filter: "\uD83D\uDD0D",
    spatial: "\uD83C\uDF10",
    effects: "\u2728",
    import: "\uD83D\uDCE6",
    vector: "\u27A1\uFE0F",
    event: "\u26A1",
    oper: "\u2795",
    func: "\uD83D\uDD04",
    stereo: "\uD83D\uDD0A",
    education: "\uD83D\uDCDA",
    rendergraph: "\uD83D\uDDBC\uFE0F",
    sequencers: "\uD83C\uDFB9",
};

/** Extract the first // desc: line from a ChucK code comment header */
function extractDescription(code: string): string {
    const match = code.match(/\/\/\s*desc:\s*(.+)/);
    return match ? match[1].trim().replace(/^"(.*)"$/, "$1") : "";
}

/** Fetch the More Examples JSON and flatten all entries into WelcomeExample[] */
async function fetchMoreExamples(
    isChuGL: boolean
): Promise<WelcomeExample[]> {
    const url = isChuGL
        ? "examples/moreChuglExamples.json"
        : "examples/moreExamples.json";
    try {
        const resp = await fetch(url);
        const json: MoreExamplesJSON = await resp.json();
        return flattenMoreExamples(json);
    } catch {
        return [];
    }
}

/** Recursively flatten the JSON into WelcomeExample[], one per file entry */
function flattenMoreExamples(json: MoreExamplesJSON): WelcomeExample[] {
    const results: WelcomeExample[] = [];
    const seen = new Set<string>();
    for (const folder in json) {
        const icon = FOLDER_ICONS[folder] || "\uD83D\uDCC4";
        for (const item of json[folder]) {
            if (typeof item !== "object") continue;
            const ex = Object.values(item)[0];
            if (seen.has(ex.name)) continue;
            seen.add(ex.name);

            const desc = extractDescription(ex.code);
            results.push({
                title: ex.name.replace(/\.(ck|js)$/, ""),
                icon,
                description: desc || ex.name,
                filename: ex.name,
                load: () => {
                    ProjectSystem.removeBlankDefaultFile();
                    ProjectSystem.addNewFile(ex.name, ex.code);
                    for (const dataUrl of ex.data) {
                        if (isPlaintextFile(dataUrl)) {
                            fetchTextFile(dataUrl).then((f) => {
                                if (f)
                                    ProjectSystem.addNewFile(
                                        f.name,
                                        f.data as string
                                    );
                            });
                        } else {
                            fetchDataFile(dataUrl).then((f) => {
                                if (f)
                                    ProjectSystem.addNewFile(
                                        f.name,
                                        f.data as Uint8Array
                                    );
                            });
                        }
                    }
                },
            });
        }
    }
    return results;
}

/**
 * Merge handcrafted examples with More Examples from JSON.
 * Handcrafted entries take priority (by filename) since they have
 * curated icons, blurbs, and special load logic.
 */
function mergeExamples(
    curated: WelcomeExample[],
    more: WelcomeExample[]
): WelcomeExample[] {
    const curatedNames = new Set(curated.map((e) => e.filename));
    const extra = more.filter((e) => !curatedNames.has(e.filename));
    return [...curated, ...extra];
}

// ---- Deterministic daily rotation helpers ----

function getDailySeed(): number {
    const now = new Date();
    return (
        now.getFullYear() * 10000 +
        (now.getMonth() + 1) * 100 +
        now.getDate()
    );
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

function buildCard(
    ex: WelcomeExample,
    onClick: () => void
): HTMLButtonElement {
    const card = document.createElement("button");
    card.type = "button";
    card.className = [
        "text-left p-3 rounded-lg border border-gray-200 dark:border-dark-5",
        "hover:border-orange dark:hover:border-orange hover:shadow-sm",
        "transition cursor-pointer bg-transparent",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange",
    ].join(" ");
    card.innerHTML = `
        <div class="font-semibold text-orange text-sm">${ex.icon} ${ex.title}</div>
        <div class="text-xs text-dark-5 dark:text-dark-a mt-0.5">${ex.description}</div>
    `;
    card.addEventListener("click", onClick);
    return card;
}

export default class WelcomeTab {
    private static overlay: HTMLDivElement | null = null;

    /**
     * Show the welcome overlay inside the editor panel.
     * Renders immediately with curated examples, then fetches More Examples
     * in the background to expand the Surprise Me pool.
     * Call dismiss() or click any example to remove it.
     */
    static show(editorPanel: HTMLElement) {
        if (WelcomeTab.overlay) return;

        const isChuGL = engineMode === "webchugl";
        const curated = isChuGL ? WEBCHUGL_EXAMPLES : WEBCHUCK_EXAMPLES;

        // Mutable reference — Surprise Me uses this, updated when More Examples load
        let allExamples: WelcomeExample[] = curated;

        // Fetch More Examples in the background
        fetchMoreExamples(isChuGL).then((more) => {
            if (more.length > 0) {
                allExamples = mergeExamples(curated, more);
            }
        });

        const overlay = document.createElement("div");
        overlay.id = "welcomeOverlay";
        overlay.className = [
            "absolute inset-0 z-10 flex flex-col items-center justify-center",
            "overflow-auto p-6",
        ].join(" ");
        overlay.style.top = "2.5rem"; // below editor header
        overlay.style.backgroundColor = "var(--ide-editor-bg, #FEFEFF)";

        // Deterministic daily shuffle (curated pool for featured + grid)
        const seed = getDailySeed();
        const rng = seededRandom(seed);
        const shuffled = seededShuffle(curated, rng);
        const featured = shuffled[0];
        const gridExamples = shuffled.slice(1, 4); // 3 examples + Surprise Me

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
            <div class="font-bold text-orange text-base">${featured.icon} ${featured.title}</div>
            <div class="text-xs text-dark-5 dark:text-dark-a mt-1">${featured.blurb || featured.description}</div>
        `;
        featuredCard.addEventListener("click", () => {
            featured.load();
            WelcomeTab.dismiss();
        });
        overlay.appendChild(featuredCard);

        // Rotating example grid (3 examples + Surprise Me)
        const grid = document.createElement("div");
        grid.className = "grid grid-cols-2 gap-3 max-w-md w-full mb-6";

        for (const ex of gridExamples) {
            grid.appendChild(
                buildCard(ex, () => {
                    ex.load();
                    WelcomeTab.dismiss();
                })
            );
        }

        // "Surprise Me" as the 4th grid card — uses allExamples (includes More Examples once loaded)
        const surpriseCard = document.createElement("button");
        surpriseCard.type = "button";
        surpriseCard.className = [
            "text-left p-3 rounded-lg border border-gray-200 dark:border-dark-5",
            "hover:border-orange dark:hover:border-orange hover:shadow-sm",
            "transition cursor-pointer bg-transparent",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange",
        ].join(" ");
        surpriseCard.innerHTML = `
            <div class="font-semibold text-orange text-sm">\uD83C\uDFB2 Surprise Me</div>
            <div class="text-xs text-dark-5 dark:text-dark-a mt-0.5">Load a random example</div>
        `;
        surpriseCard.addEventListener("click", () => {
            const random =
                allExamples[Math.floor(Math.random() * allExamples.length)];
            random.load();
            WelcomeTab.dismiss();
        });
        grid.appendChild(surpriseCard);
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
