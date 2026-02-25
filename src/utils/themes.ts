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
 * Load the saved custom theme from localStorage, or undefined.
 */
export function loadCustomTheme(): IDETheme | undefined {
    const json = localStorage.getItem("ideThemeCustom");
    if (!json) return undefined;
    try {
        return JSON.parse(json) as IDETheme;
    } catch {
        return undefined;
    }
}

/**
 * Save a custom theme to localStorage.
 */
export function saveCustomTheme(theme: IDETheme) {
    localStorage.setItem("ideThemeCustom", JSON.stringify(theme));
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
    GUI.applyTheme(theme.isDark, c.bg);

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

    // Check for saved custom theme
    if (savedId === "custom") {
        const custom = loadCustomTheme();
        if (custom) {
            applyTheme(custom);
            return;
        }
    }

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
