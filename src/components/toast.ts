//-------------------------------------------------------------------
// title: Toast
// desc:  Notification component for WebChucK IDE.
//        Displays IDE-level messages (errors, status) inline
//        in the chuck bar's left side.
//
// author: ben hoang
// date:   February 2026
//-------------------------------------------------------------------

import { getEngineMode } from "@/components/settings";
import { loadChuckFileFromURL } from "@components/fileExplorer/projectSystem";

type ToastVariant = "error" | "info";

/** Map text prefixes → icons for tip display */
const TIP_PREFIX_ICONS: [string, string][] = [
    ["Tip: ", "💡 "],
    ["Fun fact: ", "✨ "],
    ["Did you know? ", "🔎 "],
    ["Pro tip: ", "⚡ "],
    ["Reminder: ", "📌 "],
    ["Philosophy: ", "🎵 "],
    ["Try this: ", "🔬 "],
];

function applyTipIcon(el: HTMLSpanElement, tip: string): void {
    let icon = "🎸";
    let text = tip;
    for (const [prefix, ico] of TIP_PREFIX_ICONS) {
        if (tip.startsWith(prefix)) {
            icon = ico.trim();
            text = tip.slice(prefix.length);
            break;
        }
    }
    const iconSpan = document.createElement("span");
    iconSpan.style.fontSize = "1.25em";
    iconSpan.style.lineHeight = "1";
    iconSpan.style.verticalAlign = "-0.1em";
    iconSpan.textContent = icon;
    el.appendChild(iconSpan);
    el.append(" " + text);
}

// General tips — shortcuts, ChucK language, history, CCRMA, fun facts
const GENERAL_TIPS: string[] = [
    // IDE shortcuts
    "Tip: Ctrl/Cmd + Enter to run code",
    "Tip: Ctrl/Cmd + \\ to replace the last shred",
    "Tip: Ctrl/Cmd + Backspace to remove the last shred",
    "Tip: Ctrl/Cmd + . to start the VM",
    "Tip: Ctrl/Cmd + S to generate GUI from global variables",
    "Tip: Ctrl/Cmd + Shift + F to search across files",
    "Tip: Right-click a file to rename or delete it",
    "Tip: Drag and drop files into the file explorer to upload",
    "Tip: Use the Examples menu to explore ChucK programs",

    // ChucK language basics
    "Tip: SinOsc, SawOsc, SqrOsc, TriOsc are basic oscillators",
    "Tip: Chain UGens with => like SinOsc s => dac;",
    "Tip: Use <<< expr >>> to print values in ChucK",
    "Tip: 'now' advances time — e.g., 1::second => now;",
    "Tip: Spork ~ to run functions concurrently",
    "Tip: Use .freq, .gain, .phase on oscillators",
    "Tip: Use Math.random2f(lo, hi) for random floats",
    "Tip: Std.mtof(60) converts MIDI note 60 to frequency",
    "Tip: LiSa lets you record and loop live audio",
    "Tip: Connect Hid to use keyboard or mouse as input",
    "Tip: 'me' refers to the current shred",
    "Tip: Machine.add() sporkes a file as a new shred",
    "Tip: Use @=> for explicit assignment of references",
    "Tip: 'fun void foo() { }' defines a function in ChucK",
    "Tip: Arrays: [1, 2, 3] @=> int arr[];",
    "Tip: Use 'while(true)' with time advance for infinite loops",
    "Tip: Noise n => BiQuad f => dac; — instant filtered noise",
    "Tip: ADSR is an envelope generator — set with .set(a, d, s, r)",
    "Tip: Use Event to synchronize between shreds",
    "Tip: Pan2 pans audio between left and right channels",
    "Tip: Use Gain as a mixer — connect multiple sources to one Gain",
    "Tip: Delay, Echo, and JCRev are built-in effects",
    "Tip: Mandolin, Wurley, Rhodey — STK instruments in ChucK",
    "Tip: SndBuf plays .wav files — set .read to the file path",
    "Tip: Use .pos on SndBuf to seek to a sample position",
    "Tip: Use .rate on SndBuf for playback speed (-1 = reverse)",
    "Tip: Strings: \"hello\" + \" world\" works in ChucK",
    "Tip: 'if', 'else', 'for', 'while' — familiar control flow",
    "Tip: Use 'repeat(n)' as shorthand for counted loops",
    "Tip: dur and time are first-class types in ChucK",
    "Tip: 1::samp is the smallest unit of time in ChucK",
    "Tip: me.dir() returns the directory of the current file",
    "Tip: You can spork methods on objects: spork ~ obj.method();",
    "Tip: Use .last() on UGens to read the last output sample",
    "Tip: Shreds are like lightweight threads for audio",
    "Tip: The ChucK operator => means 'connect' for UGens",
    "Tip: => also means 'assign to' for variables",
    "Tip: Use 'class' to define your own types in ChucK",
    "Tip: public class Foo extends Event { } — custom events!",
    "Tip: .cap() returns the capacity of an array",
    "Tip: Use Math.PI, Math.TWO_PI, Math.E for constants",
    "Tip: Std.ftom(440.0) returns 69.0 (MIDI note for A4)",
    "Tip: RegEx.replace() is available for string manipulation",
    "Tip: ChucK has complex and polar number types",
    "Tip: Use #( ) for complex literals: #(1, 2) is 1+2i",
    "Tip: %(x, y) is a polar literal: magnitude x, phase y",
    "Tip: FFT, IFFT, and DCT are built-in analysis UGens",
    "Tip: Use Flip to convert time-domain to frequency-domain",
    "Tip: UAnaBlob holds results of UAna analysis",
    "Tip: .upchuck() triggers an analysis computation",

    // ChucK history & fun facts
    "Fun fact: ChucK was created in 2003 by Ge Wang and Perry Cook",
    "Fun fact: ChucK's name comes from 'upchuck' — to throw sound",
    "Fun fact: 'Strongly-timed' is ChucK's signature paradigm",
    "Fun fact: ChucK was Ge Wang's PhD thesis at Princeton",
    "Fun fact: The ChucK logo is called ChonK",
    "Fun fact: 'Shred' comes from shredding — as in guitar shredding",
    "Fun fact: PLOrk (Princeton Laptop Orchestra) was built on ChucK",
    "Fun fact: SLOrk (Stanford Laptop Orchestra) uses ChucK too",
    "Fun fact: The => operator was inspired by a 'patch cable'",
    "Fun fact: ChucK has been used to control robots",
    "Fun fact: ChucK programs can be added/removed while running",
    "Fun fact: 'On-the-fly programming' is ChucK's live-coding model",
    "Fun fact: ChucK's first release predates both Swift and Rust",
    "Fun fact: miniAudicle is ChucK's native desktop IDE",
    "Fun fact: WebChucK runs ChucK in the browser via WebAssembly",
    "Fun fact: ChucK is open source — github.com/ccrma/chuck",
    "Fun fact: ChucK has been taught at Stanford, Princeton, and more",
    "Fun fact: The 'dac' UGen represents your speakers",
    "Fun fact: The 'adc' UGen represents your microphone",
    "Fun fact: 'blackhole' is a silent dac — useful for analysis",
    "Fun fact: ChucK was used in the design of the Stanford iPhone app 'Ocarina'",
    "Fun fact: Smule was co-founded by Ge Wang, creator of ChucK",

    // CCRMA
    "Fun fact: CCRMA (Stanford) is one of the world's oldest computer music centers",
    "Fun fact: CCRMA stands for Center for Computer Research in Music and Acoustics",
    "Fun fact: CCRMA was founded by John Chowning, inventor of FM synthesis",
    "Fun fact: FM synthesis, invented at CCRMA, powered the Yamaha DX7",
    "Fun fact: CCRMA is located at The Knoll on the Stanford campus",
    "Fun fact: Max Mathews, the father of computer music, worked at CCRMA",
    "Fun fact: Julius O. Smith III's DSP work at CCRMA influenced ChucK's UGens",
    "Fun fact: The STK (Synthesis ToolKit) was created by Perry Cook at CCRMA/Princeton",
    "Fun fact: ChucK's physical models come from the STK library",

    // Silly
    "Did you know? 440 Hz is concert pitch A4... but 432 Hz has 'vibes'",
    "Did you know? The Nyquist frequency is half the sample rate",
    "Did you know? 44100 Hz was chosen to be compatible with video standards",
    "Pro tip: SinOsc s => dac; is the 'Hello World' of ChucK",
    "Pro tip: When in doubt, => dac",
    "Pro tip: If it sounds good, it is good",
    "Reminder: Headphones are recommended for live coding",
    "Reminder: Check your volume before running Noise => dac;",
    "Philosophy: In ChucK, time is not a suggestion — it's the law",
    "Philosophy: All sound is just numbers moving really fast",
    "Philosophy: A program that makes sound is a musical instrument",
    "\"I accidentally made music\" — every ChucK programmer, eventually",
    "The best debugger for audio code is your ears",
    "48000 samples walk into a bar. The bartender says: 'I hear you.'",
    "There are only two hard problems: naming shreds and off-by-one errors",

    // Try this — micro-experiments
    "Try this: Connect a SinOsc to another SinOsc. What happens?",
    "Try this: Set .freq to 1. Can you hear it? Can you feel it?",
    "Try this: Spork 100 shreds at once. What does chaos sound like?",
    "Try this: Change .freq while a note is playing — live!",
    "Try this: Set .gain to 0.01 and listen closely with headphones",
    "Try this: Use Std.mtof() with a 'for' loop to play a scale",
    "Try this: Connect Noise => LPF => dac and sweep the frequency",
    "Try this: Make two oscillators with frequencies 1 Hz apart — listen for beating",
    "Try this: Record yourself with adc => dac and add a JCRev",
    "Try this: Use Math.random2(0,127) with Std.mtof() for random melodies",

    // More jokes and philosophy
    "Philosophy: Code is the sheet music; the CPU is the orchestra",
    "Philosophy: There are no wrong notes, only wrong durations",
    "Philosophy: Every bug in audio code is just an unexpected remix",
    "\"It's not a bug, it's a feature\" — said every ChucK programmer about feedback",
    "The best programs start with SinOsc s => dac; and go from there",
    "44100 times per second, your speakers are just following orders",
    "Fun fact: A4 = 440 Hz was standardized in 1955 — before that, it was chaos",
    "Fun fact: The human ear can detect timing differences of about 10 microseconds",
    "Fun fact: White noise contains all frequencies at equal intensity",
    "Fun fact: The theremin, one of the earliest electronic instruments, was invented in 1920",
    "Did you know? Fourier proved any sound can be built from sine waves in 1822",
    "Did you know? The first computer-generated music was played on a Ferranti Mark 1 in 1951",
];

// WebChuGL-specific tips
const WEBCHUGL_TIPS: string[] = [
    "Tip: WebChuGL uses WebGPU for real-time graphics",
    "Tip: GGen is the base class for all ChuGL graphics objects",
    "Tip: Use GScene to set up your scene graph",
    "Tip: GCamera controls your view into the scene",
    "Tip: Check browser WebGPU support for WebChuGL",
    "Tip: ChuGL syncs graphics to audio — time drives both",
    "Tip: GG.nextFrame() => now; advances to the next frame",
    "Tip: Use GMesh + Geometry + Material to create 3D objects",
    "Tip: GCube, GSphere, GCircle — built-in geometry generators",
    "Fun fact: ChuGL was created by Andrew Zhu Aday and Ge Wang",
];

/** A tip that can optionally link to an example */
interface LinkedTip {
    text: string;
    exampleURL: string;
}

const LINKED_TIPS: LinkedTip[] = [
    {
        text: "Try this: FM synthesis is just one oscillator modulating another",
        exampleURL: "examples/fmGUI.ck",
    },
    {
        text: "Try this: Live-code a beat — add instruments one shred at a time",
        exampleURL: "examples/otf/otf_01.ck",
    },
    {
        text: "Try this: Control parameters with GUI sliders",
        exampleURL: "examples/helloSineGUI.ck",
    },
];

export default class Toast {
    private static container: HTMLDivElement;
    private static activeTimer: ReturnType<typeof setTimeout> | null = null;
    private static activeEl: HTMLSpanElement | null = null;
    private static tipEl: HTMLSpanElement | null = null;
    private static tipsEnabled: boolean = true;

    private static readonly DURATION_INFO = 3000;
    private static readonly DURATION_ERROR = 5000;
    private static readonly TIP_INTERVAL = 12000;

    constructor() {
        Toast.container =
            document.querySelector<HTMLDivElement>("#toastContainer")!;

        // Tips toggle
        Toast.tipsEnabled =
            localStorage.getItem("tipsEnabled") !== "false";
        const tipsToggle =
            document.querySelector<HTMLButtonElement>("#tipsToggle")!;
        tipsToggle.textContent = Toast.tipsEnabled ? "Tips: On" : "Tips: Off";
        tipsToggle.addEventListener("click", () => {
            Toast.tipsEnabled = !Toast.tipsEnabled;
            tipsToggle.textContent = Toast.tipsEnabled
                ? "Tips: On"
                : "Tips: Off";
            localStorage.setItem("tipsEnabled", String(Toast.tipsEnabled));
            if (Toast.tipsEnabled) {
                Toast.showTip();
            } else {
                Toast.hideTip();
            }
        });

        Toast.startTips();
    }

    /**
     * Show an error toast (red text, 5s auto-dismiss)
     */
    static error(message: string): void {
        Toast.show(message, "error", Toast.DURATION_ERROR);
    }

    /**
     * Show an info toast (neutral text, 3s auto-dismiss)
     */
    static info(message: string): void {
        Toast.show(message, "info", Toast.DURATION_INFO);
    }

    /**
     * Show a suggestion toast with a clickable action.
     * Auto-dismisses after 8 seconds (longer to give time to read).
     */
    static suggestion(message: string, onClickAction: () => void): void {
        if (!Toast.container) return;

        Toast.hideTip();

        if (Toast.activeTimer) {
            clearTimeout(Toast.activeTimer);
            Toast.activeTimer = null;
        }
        if (Toast.activeEl) {
            Toast.activeEl.remove();
            Toast.activeEl = null;
        }

        const el = document.createElement("span");
        el.className = "toast truncate cursor-pointer hover:text-orange transition";
        el.textContent = message;
        el.setAttribute("role", "status");
        el.addEventListener("click", () => {
            onClickAction();
            Toast.dismiss(el);
        });

        Toast.container.appendChild(el);
        Toast.activeEl = el;

        Toast.activeTimer = setTimeout(() => {
            Toast.dismiss(el);
        }, 8000);
    }

    // ---- Contextual encouragement ----

    private static session = {
        totalRuns: 0,
        totalErrors: 0,
        lastErrorTime: 0,
        recentRunTimes: [] as number[],
        firedMessages: new Set<string>(),
        sessionStart: Date.now(),
    };

    /**
     * Call when code runs successfully.
     * Checks triggers and shows contextual message if appropriate.
     */
    static onRunSuccess(shredCount: number): void {
        const now = Date.now();
        const s = Toast.session;
        s.totalRuns++;
        s.recentRunTimes.push(now);
        // Keep only runs in last 30 seconds
        s.recentRunTimes = s.recentRunTimes.filter((t) => now - t < 30000);

        // First successful run
        if (s.totalRuns === 1) {
            Toast.contextual(
                "first-run",
                "\u{1F389} You just made sound from code. Welcome to ChucK."
            );
            return;
        }

        // Error recovery: success right after a failure
        if (s.lastErrorTime > 0 && now - s.lastErrorTime < 30000) {
            Toast.contextual(
                "error-recovery",
                "\u{1F4AA} Fixed it! That's the ChucK way \u2014 iterate and listen."
            );
            s.lastErrorTime = 0;
        }

        // Rapid-fire: 3+ runs in 30 seconds
        if (s.recentRunTimes.length >= 3) {
            Toast.contextual(
                "rapid-fire",
                "\u26A1 You're on a roll \u2014 this is what live coding feels like."
            );
        }

        // Shred milestones
        if (shredCount >= 25) {
            Toast.contextual(
                "shreds-25",
                "\u{1F525} 25 shreds?! You absolute legend."
            );
        } else if (shredCount >= 10) {
            Toast.contextual(
                "shreds-10",
                "\u{1F525} 10 shreds running! This is an orchestra now."
            );
        } else if (shredCount >= 5) {
            Toast.contextual(
                "shreds-5",
                "\u{1F525} 5 shreds! You're building a symphony."
            );
        }

        // Late night (after midnight, before 5am)
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 5) {
            Toast.contextual(
                "late-night",
                "\u{1F319} Late night ChucKing? The best sounds happen after midnight."
            );
        }

        // Long session (1+ hours)
        if (now - s.sessionStart > 3600000) {
            Toast.contextual(
                "long-session",
                "\u23F0 You've been ChucKing for over an hour. Hydrate."
            );
        }
    }

    /**
     * Call when code fails to compile.
     */
    static onRunError(): void {
        Toast.session.totalErrors++;
        Toast.session.lastErrorTime = Date.now();
    }

    /**
     * Show a contextual encouragement message (fires at most once per key per session).
     */
    private static contextual(key: string, message: string): void {
        if (Toast.session.firedMessages.has(key)) return;
        Toast.session.firedMessages.add(key);
        Toast.show(message, "info", 4000);
    }

    private static show(message: string, variant: ToastVariant, duration: number): void {
        if (!Toast.container) return;

        // Hide tip while toast is active
        Toast.hideTip();

        // Clear any existing toast
        if (Toast.activeTimer) {
            clearTimeout(Toast.activeTimer);
            Toast.activeTimer = null;
        }
        if (Toast.activeEl) {
            Toast.activeEl.remove();
            Toast.activeEl = null;
        }

        const el = document.createElement("span");
        el.className =
            variant === "error"
                ? "toast text-red-600 dark:text-red-400 font-semibold truncate"
                : "toast truncate";
        el.textContent = message;
        el.setAttribute("role", "status");

        Toast.container.appendChild(el);
        Toast.activeEl = el;

        Toast.activeTimer = setTimeout(() => {
            Toast.dismiss(el);
        }, duration);
    }

    private static dismiss(el: HTMLElement): void {
        el.classList.add("toast-dismissing");
        el.addEventListener(
            "animationend",
            () => {
                el.remove();
                if (Toast.activeEl === el) {
                    Toast.activeEl = null;
                }
                // Restore tip after toast clears
                Toast.showTip();
            },
            { once: true }
        );
        Toast.activeTimer = null;
    }

    // ---- Tips rotation ----

    private static pickRandomTip(): string | LinkedTip {
        // 1 in 8 chance of a linked tip
        if (Math.random() < 0.125 && LINKED_TIPS.length > 0) {
            return LINKED_TIPS[Math.floor(Math.random() * LINKED_TIPS.length)];
        }
        const tips = [...GENERAL_TIPS];
        if (getEngineMode() === "webchugl") {
            tips.push(...WEBCHUGL_TIPS);
        }
        return tips[Math.floor(Math.random() * tips.length)];
    }

    private static startTips(): void {
        Toast.showTip();
        setInterval(() => {
            if (!Toast.activeEl) {
                Toast.rotateTip();
            }
        }, Toast.TIP_INTERVAL);
    }

    private static showTip(): void {
        if (!Toast.container) return;
        if (Toast.tipEl) return; // already visible
        if (!Toast.tipsEnabled) return;

        const el = document.createElement("span");
        el.className = "toast text-dark-5 dark:text-dark-a truncate opacity-60";

        const tip = Toast.pickRandomTip();
        if (typeof tip === "string") {
            applyTipIcon(el, tip);
        } else {
            applyTipIcon(el, tip.text);
            el.append(" \u2192");
            el.classList.add(
                "cursor-pointer",
                "hover:text-orange",
                "transition"
            );
            el.style.textDecoration = "underline";
            el.style.textDecorationStyle = "dotted";
            el.style.textUnderlineOffset = "3px";
            el.addEventListener("click", () => {
                loadChuckFileFromURL(tip.exampleURL);
            });
        }

        Toast.container.appendChild(el);
        Toast.tipEl = el;
    }

    private static hideTip(): void {
        if (Toast.tipEl) {
            Toast.tipEl.remove();
            Toast.tipEl = null;
        }
    }

    private static rotateTip(): void {
        if (Toast.tipEl) {
            // Fade out old tip, then show new one
            Toast.tipEl.classList.add("toast-dismissing");
            const oldTip = Toast.tipEl;
            Toast.tipEl = null;
            oldTip.addEventListener(
                "animationend",
                () => {
                    oldTip.remove();
                    // Only show new tip if no toast is active
                    if (!Toast.activeEl) {
                        Toast.showTip();
                    }
                },
                { once: true }
            );
        } else {
            Toast.showTip();
        }
    }
}
