//---------------------------------------------------
// title: Settings
// desc:  IDE settings modal for ChucK versions
//        and engine mode (WebChucK vs WebChuGL)
//
// author: terry feng
// date:   April 2024
//---------------------------------------------------

import { selectChuckSrc } from "@/host";

const versionString = Object.freeze({
    stable: "stable",
    dev: "dev",
});

const engineString = Object.freeze({
    webchuck: "webchuck",
    webchugl: "webchugl",
});

export type EngineMode = "webchuck" | "webchugl";

/**
 * Read the current engine mode from localStorage
 */
export function getEngineMode(): EngineMode {
    const stored = localStorage.getItem("engineMode");
    return stored === engineString.webchugl
        ? engineString.webchugl
        : engineString.webchuck;
}

export default class Settings {
    public static openButton: HTMLButtonElement;
    public static modal: HTMLDialogElement;
    public static closeButton: HTMLButtonElement;
    public static applyButton: HTMLButtonElement;
    public static versionSelect: HTMLSelectElement;
    public static versionDescription: HTMLParagraphElement;
    public static sampleRateSelect: HTMLSelectElement;
    public static sampleRateDescription: HTMLParagraphElement;
    public static versionGroup: HTMLDivElement;
    public static engineSelect: HTMLSelectElement;
    public static engineDescription: HTMLParagraphElement;

    constructor() {
        Settings.openButton =
            document.querySelector<HTMLButtonElement>("#openSettings")!;
        Settings.modal =
            document.querySelector<HTMLDialogElement>("#settings-modal")!;
        Settings.closeButton =
            document.querySelector<HTMLButtonElement>("#settings-close")!;
        Settings.applyButton =
            document.querySelector<HTMLButtonElement>("#settings-apply")!;
        Settings.versionSelect = document.querySelector<HTMLSelectElement>(
            "#chuck-version-select"
        )!;
        Settings.versionDescription =
            document.querySelector<HTMLParagraphElement>(
                "#chuck-version-desc"
            )!;
        Settings.sampleRateSelect =
            document.querySelector<HTMLSelectElement>("#sample-rate-select")!;
        Settings.sampleRateDescription =
            document.querySelector<HTMLParagraphElement>("#sample-rate-desc")!;
        Settings.versionGroup =
            document.querySelector<HTMLDivElement>("#chuck-version-group")!;
        Settings.engineSelect =
            document.querySelector<HTMLSelectElement>("#engine-select")!;
        Settings.engineDescription =
            document.querySelector<HTMLParagraphElement>("#engine-desc")!;
        Settings.sampleRateSelect =
            document.querySelector<HTMLSelectElement>("#sample-rate-select")!;
        Settings.sampleRateDescription =
            document.querySelector<HTMLParagraphElement>("#sample-rate-desc")!;

        // Open settings
        Settings.openButton.addEventListener("click", () => {
            Settings.modal.showModal();
        });
        // Close settings
        Settings.closeButton.addEventListener("click", () => {
            Settings.modal.close();
        });
        Settings.modal.addEventListener("click", (e) => {
            if (e.target === Settings.modal) {
                Settings.modal.close();
            }
        });
        // Apply button
        Settings.applyButton.addEventListener("click", () => {
            this.applySettings();
        });

        // Engine select
        Settings.engineSelect.addEventListener("change", () => {
            this.selectEngine(Settings.engineSelect.value as EngineMode);
        });
        this.selectEngine(getEngineMode());

        // Chuck version select
        Settings.versionSelect.addEventListener("change", () => {
            this.selectChucKVersion(Settings.versionSelect.value);
        });
        this.selectChucKVersion(
            localStorage.getItem("chuckVersion") || versionString.stable
        );

        // Sample rate select
        const storedRate = localStorage.getItem("sampleRate") || "default";
        Settings.sampleRateSelect.value = storedRate;
        this.updateSampleRateDescription(storedRate);
        Settings.sampleRateSelect.addEventListener("change", () => {
            this.updateSampleRateDescription(
                Settings.sampleRateSelect.value
            );
        });
    }

    /**
     * Select engine mode (WebChucK or WebChuGL)
     */
    selectEngine(engine: EngineMode) {
        Settings.engineSelect.value = engine;
        if (engine === engineString.webchugl) {
            Settings.engineDescription.textContent =
                "ChucK with ChuGL graphics (WebGPU). Enables 3D rendering.";
            // Hide version dropdown — WebChuGL has its own version
            Settings.versionGroup.classList.add("hidden");
        } else {
            Settings.engineDescription.textContent =
                "Audio-only ChucK runtime. Lightweight and fast.";
            Settings.versionGroup.classList.remove("hidden");
        }
    }

    /**
     * Select ChucK version
     * @param version stable or dev version of ChucK
     */
    selectChucKVersion(version: string) {
        if (version === versionString.stable) {
            Settings.versionDescription.innerHTML =
                "Latest stable version of ChucK available via <a href='https://chuck.stanford.edu/webchuck' target='_blank' class='text-orange-light underline'>WebChucK</a>";
        } else {
            Settings.versionDescription.innerHTML =
                "Bleeding edge version of ChucK. Built from the tip of <a href='https://github.com/ccrma/chuck' target='_blank' class='text-orange-light underline'>main</a>";
        }
        Settings.versionSelect.value = version;
    }

    /**
     * Update sample rate description text
     */
    updateSampleRateDescription(value: string) {
        if (value === "default") {
            Settings.sampleRateDescription.textContent =
                "Use the system default sample rate (usually 44100 or 48000 Hz).";
        } else {
            Settings.sampleRateDescription.textContent =
                `Audio will run at ${value} Hz.`;
        }
    }

    // TODO: Set the audio context sink
    static setAudioContextSink(index: number) {
        // audioContext.setSinkId(index.toString());
        console.log("Setting audio context sink to", index);
    }

    /**
     * Apply settings and refresh the page
     */
    applySettings() {
        // Flag so the editor shows a confirmation message after reload
        sessionStorage.setItem("settingsReload", "true");

        // Save engine mode
        localStorage.setItem("engineMode", Settings.engineSelect.value);

        // Save ChucK version (only relevant for WebChucK mode)
        const version = Settings.versionSelect.value === versionString.stable;
        selectChuckSrc(version);
        localStorage.setItem(
            "chuckVersion",
            version ? versionString.stable : versionString.dev
        );

        // Save sample rate
        localStorage.setItem("sampleRate", Settings.sampleRateSelect.value);

        // TODO: Reload the page for now, but should be able to just change the AudioWorkletNode/AudioContext
        location.reload();
    }
}
