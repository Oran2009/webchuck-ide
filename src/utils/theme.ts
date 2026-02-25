//------------------------------------------------------------
// title: Theme
// desc:  Theme initialization and View dropdown wiring.
//        Delegates actual theme application to themes.ts.
//
// author: terry feng
// date:   August 2023
//------------------------------------------------------------

import {
    PRESET_THEMES,
    applyTheme,
    getActiveTheme,
    initThemeSystem,
    isFollowingSystem,
    setFollowSystem,
    type IDETheme,
} from "@/utils/themes";
import ThemeEditor from "@/components/themeEditor";

// Header color constants (used by editorPanelHeader, outputPanelHeader, etc.)
export const ACCENT_COLOR_CLASS: string = "text-orange";
export const TEXT_COLOR_CLASS: string = "text-dark-5";
export const HOVER_COLOR_CLASS: string = "hover:text-dark-8";
export const DARK_TEXT_HOVER_CLASS: string = "dark:text-dark-a";
export const DARK_HOVER_COLOR_CLASS: string = "dark:hover:text-dark-c";

/**
 * Get the current color scheme.
 */
export function getColorScheme(): string {
    return getActiveTheme().isDark ? "dark" : "light";
}

/**
 * Set the color scheme (called by components that still use the old API).
 * Delegates to the new theme system.
 */
export function setColorScheme() {
    applyTheme(getActiveTheme());
}

/**
 * Initialize theme UI in the View dropdown.
 * Call once from Main.init().
 */
export function initTheme() {
    initThemeSystem();
    buildThemeDropdown();
    wireFollowSystem();
}

/**
 * Build preset theme buttons in the View dropdown.
 */
function buildThemeDropdown() {
    const list = document.getElementById("themePresetList");
    if (!list) return;

    for (const preset of PRESET_THEMES) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dropdownItem";
        btn.setAttribute("role", "menuitem");
        btn.dataset.themeId = preset.id;
        updateThemeCheckmark(btn, preset);

        btn.addEventListener("click", () => {
            // Disable follow system when manually selecting a theme
            localStorage.setItem("colorPreference", "false");
            const followBtn = document.getElementById("followSystemToggle");
            if (followBtn) followBtn.textContent = "Follow System: Off";

            applyTheme(preset);
            refreshThemeCheckmarks();
        });

        list.appendChild(btn);
    }

    // Custom theme button
    document.getElementById("customThemeButton")?.addEventListener("click", () => {
        openCustomThemeEditor();
    });
}

/**
 * Update checkmark prefix on a theme button.
 */
function updateThemeCheckmark(btn: HTMLElement, preset: IDETheme) {
    const isActive = getActiveTheme().id === preset.id;
    const suffix = isActive ? " \u2713" : "";
    btn.textContent = preset.name + suffix;
}

/**
 * Refresh all theme checkmarks after a theme change.
 */
export function refreshThemeCheckmarks() {
    const list = document.getElementById("themePresetList");
    if (!list) return;
    const buttons = list.querySelectorAll<HTMLButtonElement>("button[data-theme-id]");
    buttons.forEach((btn) => {
        const id = btn.dataset.themeId!;
        const preset = PRESET_THEMES.find((t) => t.id === id);
        if (preset) updateThemeCheckmark(btn, preset);
    });
}

/**
 * Wire up the Follow System toggle.
 */
function wireFollowSystem() {
    const btn = document.getElementById("followSystemToggle");
    if (!btn) return;

    const following = isFollowingSystem();
    btn.textContent = "Follow System: " + (following ? "On" : "Off");

    btn.addEventListener("click", () => {
        const nowFollowing = !isFollowingSystem();
        setFollowSystem(nowFollowing);
        btn.textContent = "Follow System: " + (nowFollowing ? "On" : "Off");
        refreshThemeCheckmarks();
    });

    // Listen for OS preference changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (isFollowingSystem()) {
            applyTheme(e.matches ? PRESET_THEMES[1] : PRESET_THEMES[0]);
            refreshThemeCheckmarks();
        }
    });
}

/**
 * Open the custom theme editor modal.
 */
function openCustomThemeEditor() {
    ThemeEditor.open();
}
