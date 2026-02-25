//-------------------------------------------------------------------
// title: Suggestions
// desc:  "Try this next" — after running a library example, occasionally
//        suggest a related example via toast. Hand-curated relationships.
//
// author: terry feng
// date:   February 2026
//-------------------------------------------------------------------

import {
    loadChuckFileFromURL,
    loadDataFileFromURL,
} from "@components/fileExplorer/projectSystem";
import Toast from "@/components/toast";

interface Suggestion {
    text: string;
    load: () => void;
}

/**
 * Map of example filename → related suggestions.
 * Only covers popular starting points.
 */
const SUGGESTION_MAP: Record<string, Suggestion[]> = {
    "helloSine.ck": [
        {
            text: "\uD83D\uDC49 Liked Hello Sine? Try the GUI version \u2014 add a frequency slider",
            load: () => loadChuckFileFromURL("examples/helloSineGUI.ck"),
        },
        {
            text: "\uD83D\uDC49 Liked Hello Sine? Try Harmonic Series Arp \u2014 hear the overtones",
            load: () => loadChuckFileFromURL("examples/harmonicSeriesArp.ck"),
        },
    ],
    "harmonicSeriesArp.ck": [
        {
            text: "\uD83D\uDC49 Into harmonics? Try FM Synthesis \u2014 modulate oscillators together",
            load: () => loadChuckFileFromURL("examples/fmGUI.ck"),
        },
    ],
    "slammin.ck": [
        {
            text: "\uD83D\uDC49 Nice beat! Try On-the-fly \u2014 add instruments one at a time",
            load: () => {
                loadChuckFileFromURL("examples/otf/otf_01.ck");
                loadDataFileFromURL("examples/otf/data/kick.wav");
            },
        },
    ],
    "otf_01.ck": [
        {
            text: "\uD83D\uDC49 Got the kick going? Add a hi-hat \u2014 run otf_02.ck next",
            load: () => {
                loadChuckFileFromURL("examples/otf/otf_02.ck");
                loadDataFileFromURL("examples/otf/data/hihat.wav");
            },
        },
    ],
    "fmGUI.ck": [
        {
            text: "\uD83D\uDC49 Like GUI controls? Try Hello Sine GUI for a simpler version",
            load: () => loadChuckFileFromURL("examples/helloSineGUI.ck"),
        },
    ],
    "helloSineGUI.ck": [
        {
            text: "\uD83D\uDC49 Ready for more? Try FM Synthesis GUI \u2014 two oscillators, more parameters",
            load: () => loadChuckFileFromURL("examples/fmGUI.ck"),
        },
    ],
    "mouseHID.ck": [
        {
            text: "\uD83D\uDC49 Like mouse control? Try Keyboard Organ \u2014 play notes with your keyboard",
            load: () => loadChuckFileFromURL("examples/keyboardHID.ck"),
        },
    ],
    "keyboardHID.ck": [
        {
            text: "\uD83D\uDC49 Try Mouse PWM HID \u2014 control sound with cursor position",
            load: () => loadChuckFileFromURL("examples/mouseHID.ck"),
        },
    ],
};

/** Track which examples we've already suggested for (once per session) */
const suggestedFor = new Set<string>();

/** Track the last example filename loaded from the library */
let lastLoadedExample: string | null = null;

export function setLoadedExample(filename: string): void {
    lastLoadedExample = filename;
}

export function getAndClearLoadedExample(): string | null {
    const name = lastLoadedExample;
    lastLoadedExample = null;
    return name;
}

/**
 * Call when a library example starts running.
 * @param filename The .ck filename that was just run
 */
export function onExampleRun(filename: string): void {
    // Extract just the filename from any path
    const base = filename.split("/").pop() ?? filename;

    if (suggestedFor.has(base)) return;
    if (!SUGGESTION_MAP[base]) return;

    // 50% chance of suggesting
    if (Math.random() > 0.5) return;

    suggestedFor.add(base);

    const suggestions = SUGGESTION_MAP[base];
    const suggestion =
        suggestions[Math.floor(Math.random() * suggestions.length)];

    // Delay suggestion by ~20 seconds
    setTimeout(() => {
        Toast.suggestion(suggestion.text, suggestion.load);
    }, 20000);
}
