//------------------------------------------------------------
// title: Themes
// desc:  Theme data model, preset themes, and theme application
//        engine for the WebChucK IDE custom theming system.
//
// author: claude
// date:   February 2026
//------------------------------------------------------------

import Editor from "@/components/editor/monaco/editor";
import Console from "@/components/outputPanel/console";
import GUI from "@/components/inputPanel/gui/gui";
import Pet from "@/components/pet";
import { visual } from "@/host";

/**
 * The shape of every IDE theme — preset or custom.
 * This is the single source of truth for all colors.
 */
export interface IDETheme {
    id: string;
    name: string;
    isDark: boolean;
    colors: {
        // Shell (IDE chrome)
        bg: string;
        bgAlt: string;
        text: string;
        textMuted: string;
        accent: string;
        accentHover: string;
        border: string;

        // Editor (Monaco)
        editorBg: string;
        editorText: string;
        editorKeyword: string;
        editorType: string;
        editorComment: string;
        editorString: string;
        editorNumber: string;
        editorEvent: string;
        editorLibrary: string;

        // Console (xterm)
        consoleBg: string;
        consoleText: string;

        // Visualizer
        waveformColor: string;
        spectrumColor: string;
        spectrumFill: string;
    };
}

// ── Preset Themes ─────────────────────────────────────────

export const PRESET_THEMES: IDETheme[] = [
    {
        id: "miniaudicle-light",
        name: "miniAudicle Light",
        isDark: false,
        colors: {
            bg: "#DDEEFF",
            bgAlt: "#FEFEFF",
            text: "#555555",
            textMuted: "#888888",
            accent: "#FF8833",
            accentHover: "#ffa64d",
            border: "#CCCCCC",

            editorBg: "#FEFEFF",
            editorText: "#000000",
            editorKeyword: "#0000FF",
            editorType: "#A200EC",
            editorComment: "#609010",
            editorString: "#404040",
            editorNumber: "#D48010",
            editorEvent: "#800023",
            editorLibrary: "#800023",

            consoleBg: "#ffffff",
            consoleText: "#222222",

            waveformColor: "#333333",
            spectrumColor: "#FF8833",
            spectrumFill: "#FFE5C4",
        },
    },
    {
        id: "miniaudicle-dark",
        name: "miniAudicle Dark",
        isDark: true,
        colors: {
            bg: "#222222",
            bgAlt: "#333333",
            text: "#EEEEEE",
            textMuted: "#AAAAAA",
            accent: "#FF8833",
            accentHover: "#ffa64d",
            border: "#555555",

            editorBg: "#1e1e1e",
            editorText: "#d4d4d4",
            editorKeyword: "#569cd6",
            editorType: "#d07ff5",
            editorComment: "#6a9955",
            editorString: "#ce9178",
            editorNumber: "#E49020",
            editorEvent: "#e05577",
            editorLibrary: "#d4728a",

            consoleBg: "#222222",
            consoleText: "#ffffff",

            waveformColor: "#eeeeee",
            spectrumColor: "#FF8833",
            spectrumFill: "#D2691E",
        },
    },
    {
        id: "monokai",
        name: "Monokai",
        isDark: true,
        colors: {
            bg: "#1e1e1e",
            bgAlt: "#272822",
            text: "#F8F8F2",
            textMuted: "#75715E",
            accent: "#F8F8A0",
            accentHover: "#E6DB74",
            border: "#49483E",

            editorBg: "#272822",
            editorText: "#F8F8F2",
            editorKeyword: "#F92672",
            editorType: "#66D9EF",
            editorComment: "#75715E",
            editorString: "#E6DB74",
            editorNumber: "#AE81FF",
            editorEvent: "#A6E22E",
            editorLibrary: "#FD971F",

            consoleBg: "#1e1e1e",
            consoleText: "#F8F8F2",

            waveformColor: "#F8F8F2",
            spectrumColor: "#F92672",
            spectrumFill: "#49483E",
        },
    },
    {
        id: "nord",
        name: "Nord",
        isDark: true,
        colors: {
            bg: "#2E3440",
            bgAlt: "#3B4252",
            text: "#D8DEE9",
            textMuted: "#81A1C1",
            accent: "#88C0D0",
            accentHover: "#8FBCBB",
            border: "#4C566A",

            editorBg: "#2E3440",
            editorText: "#D8DEE9",
            editorKeyword: "#81A1C1",
            editorType: "#8FBCBB",
            editorComment: "#616E88",
            editorString: "#A3BE8C",
            editorNumber: "#B48EAD",
            editorEvent: "#BF616A",
            editorLibrary: "#D08770",

            consoleBg: "#2E3440",
            consoleText: "#D8DEE9",

            waveformColor: "#D8DEE9",
            spectrumColor: "#88C0D0",
            spectrumFill: "#3B4252",
        },
    },
    {
        id: "ableton",
        name: "Ableton",
        isDark: true,
        colors: {
            bg: "#1A1A1A",
            bgAlt: "#232323",
            text: "#D4D4D4",
            textMuted: "#808080",
            accent: "#00FF5E",
            accentHover: "#33FF7E",
            border: "#3A3A3A",

            editorBg: "#1A1A1A",
            editorText: "#D4D4D4",
            editorKeyword: "#00FF5E",
            editorType: "#FF6B2B",
            editorComment: "#5E5E5E",
            editorString: "#FFD23F",
            editorNumber: "#9580FF",
            editorEvent: "#FF4081",
            editorLibrary: "#FF6B2B",

            consoleBg: "#121212",
            consoleText: "#D4D4D4",

            waveformColor: "#00FF5E",
            spectrumColor: "#FF6B2B",
            spectrumFill: "#2A2A2A",
        },
    },
    {
        id: "vinyl",
        name: "Vinyl",
        isDark: true,
        colors: {
            bg: "#1F1A15",
            bgAlt: "#2A1F1A",
            text: "#D4C4B0",
            textMuted: "#8A7A6A",
            accent: "#D4A574",
            accentHover: "#E0B888",
            border: "#3A2F25",

            editorBg: "#2A1F1A",
            editorText: "#D4C4B0",
            editorKeyword: "#D4A574",
            editorType: "#C49A6C",
            editorComment: "#6A5A4A",
            editorString: "#A8C072",
            editorNumber: "#E0A050",
            editorEvent: "#CC7766",
            editorLibrary: "#B08860",

            consoleBg: "#1F1A15",
            consoleText: "#D4C4B0",

            waveformColor: "#D4C4B0",
            spectrumColor: "#D4A574",
            spectrumFill: "#3A2F25",
        },
    },
    {
        id: "tokyo-night",
        name: "Tokyo Night",
        isDark: true,
        colors: {
            bg: "#1A1B26",
            bgAlt: "#24283B",
            text: "#A9B1D6",
            textMuted: "#565F89",
            accent: "#7AA2F7",
            accentHover: "#89B4FA",
            border: "#3B4261",

            editorBg: "#1A1B26",
            editorText: "#A9B1D6",
            editorKeyword: "#9D7CD8",
            editorType: "#2AC3DE",
            editorComment: "#565F89",
            editorString: "#9ECE6A",
            editorNumber: "#FF9E64",
            editorEvent: "#F7768E",
            editorLibrary: "#7AA2F7",

            consoleBg: "#1A1B26",
            consoleText: "#A9B1D6",

            waveformColor: "#A9B1D6",
            spectrumColor: "#7AA2F7",
            spectrumFill: "#24283B",
        },
    },
    {
        id: "solarized-light",
        name: "Solarized Light",
        isDark: false,
        colors: {
            bg: "#FDF6E3",
            bgAlt: "#EEE8D5",
            text: "#657B83",
            textMuted: "#93A1A1",
            accent: "#CB4B16",
            accentHover: "#DC4B11",
            border: "#D3CBB8",

            editorBg: "#FDF6E3",
            editorText: "#657B83",
            editorKeyword: "#859900",
            editorType: "#268BD2",
            editorComment: "#93A1A1",
            editorString: "#2AA198",
            editorNumber: "#D33682",
            editorEvent: "#CB4B16",
            editorLibrary: "#6C71C4",

            consoleBg: "#FDF6E3",
            consoleText: "#657B83",

            waveformColor: "#586E75",
            spectrumColor: "#CB4B16",
            spectrumFill: "#EEE8D5",
        },
    },
    {
        id: "solarized-dark",
        name: "Solarized Dark",
        isDark: true,
        colors: {
            bg: "#002B36",
            bgAlt: "#073642",
            text: "#839496",
            textMuted: "#586E75",
            accent: "#CB4B16",
            accentHover: "#DC4B11",
            border: "#094855",

            editorBg: "#002B36",
            editorText: "#839496",
            editorKeyword: "#859900",
            editorType: "#268BD2",
            editorComment: "#586E75",
            editorString: "#2AA198",
            editorNumber: "#D33682",
            editorEvent: "#CB4B16",
            editorLibrary: "#6C71C4",

            consoleBg: "#002B36",
            consoleText: "#839496",

            waveformColor: "#93A1A1",
            spectrumColor: "#CB4B16",
            spectrumFill: "#073642",
        },
    },
    {
        id: "dracula",
        name: "Dracula",
        isDark: true,
        colors: {
            bg: "#21222C",
            bgAlt: "#282A36",
            text: "#F8F8F2",
            textMuted: "#6272A4",
            accent: "#BD93F9",
            accentHover: "#CCA4FF",
            border: "#44475A",

            editorBg: "#282A36",
            editorText: "#F8F8F2",
            editorKeyword: "#FF79C6",
            editorType: "#8BE9FD",
            editorComment: "#6272A4",
            editorString: "#F1FA8C",
            editorNumber: "#BD93F9",
            editorEvent: "#FFB86C",
            editorLibrary: "#50FA7B",

            consoleBg: "#21222C",
            consoleText: "#F8F8F2",

            waveformColor: "#F8F8F2",
            spectrumColor: "#BD93F9",
            spectrumFill: "#44475A",
        },
    },
    {
        id: "catppuccin-mocha",
        name: "Catppuccin Mocha",
        isDark: true,
        colors: {
            bg: "#1E1E2E",
            bgAlt: "#313244",
            text: "#CDD6F4",
            textMuted: "#6C7086",
            accent: "#CBA6F7",
            accentHover: "#D4BBFF",
            border: "#45475A",

            editorBg: "#1E1E2E",
            editorText: "#CDD6F4",
            editorKeyword: "#CBA6F7",
            editorType: "#89DCEB",
            editorComment: "#6C7086",
            editorString: "#A6E3A1",
            editorNumber: "#FAB387",
            editorEvent: "#F38BA8",
            editorLibrary: "#89B4FA",

            consoleBg: "#1E1E2E",
            consoleText: "#CDD6F4",

            waveformColor: "#CDD6F4",
            spectrumColor: "#CBA6F7",
            spectrumFill: "#313244",
        },
    },
    {
        id: "github-light",
        name: "GitHub Light",
        isDark: false,
        colors: {
            bg: "#F6F8FA",
            bgAlt: "#FFFFFF",
            text: "#24292F",
            textMuted: "#656D76",
            accent: "#0969DA",
            accentHover: "#0550AE",
            border: "#D0D7DE",

            editorBg: "#FFFFFF",
            editorText: "#24292F",
            editorKeyword: "#CF222E",
            editorType: "#8250DF",
            editorComment: "#6E7781",
            editorString: "#0A3069",
            editorNumber: "#0550AE",
            editorEvent: "#953800",
            editorLibrary: "#8250DF",

            consoleBg: "#FFFFFF",
            consoleText: "#24292F",

            waveformColor: "#24292F",
            spectrumColor: "#0969DA",
            spectrumFill: "#DDF4FF",
        },
    },
];

// ── Theme State ───────────────────────────────────────────

let activeTheme: IDETheme = PRESET_THEMES[0];

/**
 * Get a preset theme by ID. Returns undefined if not found.
 */
export function getPresetById(id: string): IDETheme | undefined {
    return PRESET_THEMES.find((t) => t.id === id);
}

/**
 * Get the currently active theme.
 */
export function getActiveTheme(): IDETheme {
    return activeTheme;
}

/**
 * Apply a theme to the entire IDE.
 *
 * 1. Sets CSS custom properties on <html>
 * 2. Toggles Tailwind `dark` class
 * 3. Defines + applies Monaco editor theme
 * 4. Updates xterm console colors
 * 5. Updates canvas components (visualizer, GUI)
 * 6. Persists choice to localStorage
 */
export function applyTheme(theme: IDETheme) {
    activeTheme = theme;
    const root = document.documentElement;

    // 1. CSS Custom Properties
    const c = theme.colors;
    root.style.setProperty("--ide-bg", c.bg);
    root.style.setProperty("--ide-bg-alt", c.bgAlt);
    root.style.setProperty("--ide-text", c.text);
    root.style.setProperty("--ide-text-muted", c.textMuted);
    root.style.setProperty("--ide-accent", c.accent);
    root.style.setProperty("--ide-accent-hover", c.accentHover);
    root.style.setProperty("--ide-border", c.border);
    root.style.setProperty("--ide-editor-bg", c.editorBg);
    root.style.setProperty("--ide-console-bg", c.consoleBg);

    // 2. Tailwind dark class
    if (theme.isDark) {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }

    // 3. Monaco editor theme
    Editor.applyDynamicTheme(theme);

    // 4. xterm console
    Console.applyThemeColors(c.consoleBg, c.consoleText);

    // 5. Canvas components
    visual?.applyThemeColors(c.waveformColor, c.spectrumColor, c.spectrumFill);
    Pet.applyTheme(theme.isDark);
    GUI.applyTheme(theme.isDark, {
        bg: c.bg,
        bgAlt: c.bgAlt,
        text: c.text,
        textMuted: c.textMuted,
        accent: c.accent,
        border: c.border,
    });

    // 6. Persist
    localStorage.setItem("ideTheme", theme.id);
    // Keep legacy key in sync for the inline <script> in index.html
    localStorage.setItem("theme", theme.isDark ? "dark" : "light");
}

/**
 * Initialize theming on page load. Reads saved theme from localStorage
 * and applies it. Falls back to miniAudicle Light.
 */
export function initThemeSystem() {
    const savedId = localStorage.getItem("ideTheme");

    // Check for saved preset
    if (savedId) {
        const preset = getPresetById(savedId);
        if (preset) {
            applyTheme(preset);
            return;
        }
    }

    // Migrate from legacy localStorage.theme
    const legacy = localStorage.getItem("theme");
    if (legacy === "dark") {
        applyTheme(PRESET_THEMES[1]); // miniAudicle Dark
    } else {
        applyTheme(PRESET_THEMES[0]); // miniAudicle Light
    }
}

/**
 * Handle "Follow System" preference. When on, auto-switches
 * between user's light/dark presets on OS preference change.
 */
export function setFollowSystem(enabled: boolean) {
    localStorage.setItem("colorPreference", enabled ? "true" : "false");
    if (enabled) {
        const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;
        applyTheme(prefersDark ? PRESET_THEMES[1] : PRESET_THEMES[0]);
    }
}

export function isFollowingSystem(): boolean {
    return localStorage.getItem("colorPreference") !== "false";
}
