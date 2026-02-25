//------------------------------------------------------------
// title: Theme Editor
// desc:  Custom theme editor modal with color pickers
//        and live preview. Uses native <input type="color">.
//
// author: claude
// date:   February 2026
//------------------------------------------------------------

import {
    type IDETheme,
    applyTheme,
    getActiveTheme,
    saveCustomTheme,
    loadCustomTheme,
    PRESET_THEMES,
} from "@/utils/themes";
import { refreshThemeCheckmarks } from "@/utils/theme";

// Color groups for the editor UI
const COLOR_GROUPS: {
    label: string;
    keys: { key: keyof IDETheme["colors"]; label: string }[];
}[] = [
    {
        label: "Shell",
        keys: [
            { key: "bg", label: "Background" },
            { key: "bgAlt", label: "Alt Background" },
            { key: "text", label: "Text" },
            { key: "textMuted", label: "Muted Text" },
            { key: "accent", label: "Accent" },
            { key: "accentHover", label: "Accent Hover" },
            { key: "border", label: "Border" },
        ],
    },
    {
        label: "Editor",
        keys: [
            { key: "editorBg", label: "Background" },
            { key: "editorText", label: "Text" },
            { key: "editorKeyword", label: "Keywords" },
            { key: "editorType", label: "Types" },
            { key: "editorComment", label: "Comments" },
            { key: "editorString", label: "Strings" },
            { key: "editorNumber", label: "Numbers" },
            { key: "editorEvent", label: "Events" },
            { key: "editorLibrary", label: "Library" },
        ],
    },
    {
        label: "Console",
        keys: [
            { key: "consoleBg", label: "Background" },
            { key: "consoleText", label: "Text" },
        ],
    },
    {
        label: "Visualizer",
        keys: [
            { key: "waveformColor", label: "Waveform" },
            { key: "spectrumColor", label: "Spectrum" },
            { key: "spectrumFill", label: "Spectrum Fill" },
        ],
    },
];

export default class ThemeEditor {
    private static modal: HTMLDialogElement;
    private static workingTheme: IDETheme;
    private static previousTheme: IDETheme;
    private static initialized = false;

    /**
     * Open the custom theme editor modal.
     */
    static open() {
        if (!ThemeEditor.initialized) {
            ThemeEditor.init();
        }
        // Start from current theme or saved custom theme
        const custom = loadCustomTheme();
        ThemeEditor.previousTheme = getActiveTheme();
        ThemeEditor.workingTheme = structuredClone(custom ?? getActiveTheme());
        ThemeEditor.workingTheme.id = "custom";
        ThemeEditor.workingTheme.name = "Custom";
        ThemeEditor.render();
        ThemeEditor.modal.showModal();
    }

    /**
     * Initialize the modal element and event listeners.
     */
    private static init() {
        ThemeEditor.modal = document.querySelector<HTMLDialogElement>(
            "#theme-editor-modal"
        )!;

        // Close on backdrop click
        ThemeEditor.modal.addEventListener("click", (e) => {
            if (e.target === ThemeEditor.modal) {
                ThemeEditor.cancel();
            }
        });

        // Close on Escape
        ThemeEditor.modal.addEventListener("cancel", (e) => {
            e.preventDefault();
            ThemeEditor.cancel();
        });

        ThemeEditor.initialized = true;
    }

    /**
     * Render the modal contents.
     */
    private static render() {
        const theme = ThemeEditor.workingTheme;
        const modal = ThemeEditor.modal;

        modal.innerHTML = "";

        // Container
        const container = document.createElement("div");
        container.className = "flex flex-col h-full";

        // Header
        const header = document.createElement("div");
        header.className =
            "flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-5";
        header.innerHTML = `
            <h2 class="text-lg font-bold dark:text-white">Custom Theme</h2>
            <div class="flex items-center gap-2">
                <label class="text-sm dark:text-dark-a">Start from:</label>
                <select id="themeEditorBase" class="text-sm rounded border border-gray-300 dark:border-dark-5 bg-transparent dark:text-white px-2 py-1">
                    ${PRESET_THEMES.map((p) => `<option value="${p.id}">${p.name}</option>`).join("")}
                </select>
            </div>
        `;
        container.appendChild(header);

        // Body — two columns
        const body = document.createElement("div");
        body.className = "flex flex-1 overflow-hidden";

        // Left column: color pickers
        const left = document.createElement("div");
        left.className = "flex-1 overflow-y-auto p-4 space-y-4";

        for (const group of COLOR_GROUPS) {
            const section = document.createElement("div");
            const title = document.createElement("h3");
            title.className =
                "text-sm font-semibold mb-2 text-gray-500 dark:text-gray-400 uppercase tracking-wide";
            title.textContent = group.label;
            section.appendChild(title);

            const grid = document.createElement("div");
            grid.className = "grid grid-cols-2 gap-2";

            for (const { key, label } of group.keys) {
                const row = document.createElement("label");
                row.className =
                    "flex items-center gap-2 text-sm cursor-pointer dark:text-dark-c";

                const input = document.createElement("input");
                input.type = "color";
                input.value = theme.colors[key];
                input.className =
                    "w-7 h-7 rounded border border-gray-300 dark:border-dark-5 cursor-pointer";
                input.dataset.colorKey = key;

                input.addEventListener("input", () => {
                    ThemeEditor.workingTheme.colors[key] = input.value;
                    applyTheme(ThemeEditor.workingTheme);
                    ThemeEditor.updatePreview();
                });

                const span = document.createElement("span");
                span.textContent = label;

                row.appendChild(input);
                row.appendChild(span);
                grid.appendChild(row);
            }

            section.appendChild(grid);
            left.appendChild(section);
        }

        // Dark mode toggle for custom theme
        const darkToggle = document.createElement("label");
        darkToggle.className =
            "flex items-center gap-2 text-sm mt-2 cursor-pointer dark:text-dark-c";
        const darkCheckbox = document.createElement("input");
        darkCheckbox.type = "checkbox";
        darkCheckbox.checked = theme.isDark;
        darkCheckbox.addEventListener("change", () => {
            ThemeEditor.workingTheme.isDark = darkCheckbox.checked;
            applyTheme(ThemeEditor.workingTheme);
            ThemeEditor.updatePreview();
        });
        darkToggle.appendChild(darkCheckbox);
        darkToggle.appendChild(
            document.createTextNode(
                "Dark base (affects Monaco inherited tokens)"
            )
        );
        left.appendChild(darkToggle);

        body.appendChild(left);

        // Right column: live preview
        const right = document.createElement("div");
        right.className =
            "w-48 border-l border-gray-200 dark:border-dark-5 p-4 flex flex-col gap-2";
        right.id = "themeEditorPreview";
        body.appendChild(right);

        container.appendChild(body);

        // Footer
        const footer = document.createElement("div");
        footer.className =
            "flex items-center justify-between p-4 border-t border-gray-200 dark:border-dark-5";

        const resetBtn = document.createElement("button");
        resetBtn.type = "button";
        resetBtn.className =
            "text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline cursor-pointer";
        resetBtn.textContent = "Reset";
        resetBtn.addEventListener("click", () => {
            ThemeEditor.workingTheme = structuredClone(
                ThemeEditor.previousTheme
            );
            ThemeEditor.workingTheme.id = "custom";
            ThemeEditor.workingTheme.name = "Custom";
            ThemeEditor.render();
            applyTheme(ThemeEditor.workingTheme);
        });

        const btnGroup = document.createElement("div");
        btnGroup.className = "flex gap-2";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className =
            "px-4 py-1.5 text-sm rounded border border-gray-300 dark:border-dark-5 hover:bg-gray-100 dark:hover:bg-dark-4 cursor-pointer";
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", () => ThemeEditor.cancel());

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className =
            "px-4 py-1.5 text-sm rounded bg-orange text-white hover:bg-orange-dark cursor-pointer";
        saveBtn.textContent = "Save Theme";
        saveBtn.addEventListener("click", () => ThemeEditor.save());

        btnGroup.appendChild(cancelBtn);
        btnGroup.appendChild(saveBtn);
        footer.appendChild(resetBtn);
        footer.appendChild(btnGroup);
        container.appendChild(footer);

        modal.appendChild(container);

        // Wire up "Start from" dropdown
        const baseSelect =
            modal.querySelector<HTMLSelectElement>("#themeEditorBase");
        baseSelect?.addEventListener("change", () => {
            const preset = PRESET_THEMES.find(
                (p) => p.id === baseSelect.value
            );
            if (preset) {
                ThemeEditor.workingTheme = structuredClone(preset);
                ThemeEditor.workingTheme.id = "custom";
                ThemeEditor.workingTheme.name = "Custom";
                applyTheme(ThemeEditor.workingTheme);
                ThemeEditor.render();
            }
        });

        ThemeEditor.updatePreview();
    }

    /**
     * Update the live preview panel.
     */
    private static updatePreview() {
        const preview = document.getElementById("themeEditorPreview");
        if (!preview) return;

        const c = ThemeEditor.workingTheme.colors;
        preview.innerHTML = "";

        const label = document.createElement("div");
        label.className =
            "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1";
        label.textContent = "Preview";
        preview.appendChild(label);

        // Mini IDE mockup
        const mockup = document.createElement("div");
        mockup.className = "rounded overflow-hidden border text-xs";
        mockup.style.borderColor = c.border;

        // Title bar
        const titleBar = document.createElement("div");
        titleBar.className = "px-2 py-1 font-semibold";
        titleBar.style.backgroundColor = c.bgAlt;
        titleBar.style.color = c.accent;
        titleBar.textContent = "WebChucK IDE";
        mockup.appendChild(titleBar);

        // Editor area
        const editorArea = document.createElement("div");
        editorArea.className = "px-2 py-2 font-mono leading-relaxed";
        editorArea.style.backgroundColor = c.editorBg;
        editorArea.innerHTML = `
            <div><span style="color:${c.editorComment}">// hello!</span></div>
            <div><span style="color:${c.editorKeyword}">SinOsc</span> <span style="color:${c.editorText}">s =&gt;</span> <span style="color:${c.editorLibrary}">dac</span><span style="color:${c.editorText}">;</span></div>
            <div><span style="color:${c.editorNumber}">440</span> <span style="color:${c.editorText}">=&gt;</span> <span style="color:${c.editorText}">s.freq;</span></div>
            <div><span style="color:${c.editorString}">"hey"</span> <span style="color:${c.editorText}">=&gt;</span> <span style="color:${c.editorType}">string</span> <span style="color:${c.editorText}">msg;</span></div>
        `;
        mockup.appendChild(editorArea);

        // Console area
        const consoleArea = document.createElement("div");
        consoleArea.className = "px-2 py-1 font-mono";
        consoleArea.style.backgroundColor = c.consoleBg;
        consoleArea.style.color = c.consoleText;
        consoleArea.textContent = "> running...";
        mockup.appendChild(consoleArea);

        // Visualizer area
        const vizArea = document.createElement("div");
        vizArea.className = "h-4 flex items-center justify-center";
        vizArea.style.backgroundColor = c.bg;
        vizArea.innerHTML = `<svg width="80" height="12"><polyline points="0,6 10,2 20,10 30,4 40,8 50,3 60,9 70,5 80,6" fill="none" stroke="${c.waveformColor}" stroke-width="1.5"/></svg>`;
        mockup.appendChild(vizArea);

        preview.appendChild(mockup);

        // Accent swatch
        const swatchRow = document.createElement("div");
        swatchRow.className = "flex items-center gap-2 mt-2";
        const swatch = document.createElement("div");
        swatch.className = "w-4 h-4 rounded";
        swatch.style.backgroundColor = c.accent;
        const swatchLabel = document.createElement("span");
        swatchLabel.className = "text-xs dark:text-dark-a";
        swatchLabel.textContent = "Accent";
        swatchRow.appendChild(swatch);
        swatchRow.appendChild(swatchLabel);
        preview.appendChild(swatchRow);
    }

    /**
     * Save the custom theme and close.
     */
    private static save() {
        saveCustomTheme(ThemeEditor.workingTheme);
        applyTheme(ThemeEditor.workingTheme);
        refreshThemeCheckmarks();
        ThemeEditor.modal.close();
    }

    /**
     * Cancel editing — revert to previous theme.
     */
    private static cancel() {
        applyTheme(ThemeEditor.previousTheme);
        ThemeEditor.modal.close();
    }
}
