import ProjectSystem from "./projectSystem";
import Editor from "@/components/editor/monaco/editor";

const searchPanel =
    document.querySelector<HTMLDivElement>("#searchPanel")!;
const searchInput =
    document.querySelector<HTMLInputElement>("#searchInput")!;
const searchResults =
    document.querySelector<HTMLDivElement>("#searchResults")!;
const searchToggleBtn =
    document.querySelector<HTMLButtonElement>("#searchToggleBtn")!;
const searchCloseBtn =
    document.querySelector<HTMLButtonElement>("#searchCloseBtn")!;
const fileExplorerHeader =
    document.querySelector<HTMLDivElement>("#fileExplorerHeader")!;
const fileExplorerContainer =
    document.querySelector<HTMLDivElement>("#fileExplorerContainer")!;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export default class FindInProject {
    constructor() {
        searchToggleBtn.addEventListener("click", () => {
            FindInProject.toggle();
        });

        searchCloseBtn.addEventListener("click", () => {
            FindInProject.hide();
        });

        searchInput.addEventListener("input", () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                FindInProject.search(searchInput.value);
            }, 200);
        });

        searchInput.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                FindInProject.hide();
            }
        });
    }

    static toggle() {
        if (searchPanel.classList.contains("hidden")) {
            FindInProject.show();
        } else {
            FindInProject.hide();
        }
    }

    static show() {
        fileExplorerHeader.classList.add("hidden");
        fileExplorerContainer.classList.add("hidden");
        searchPanel.classList.remove("hidden");
        searchInput.focus();
        searchInput.select();
    }

    static hide() {
        searchPanel.classList.add("hidden");
        fileExplorerHeader.classList.remove("hidden");
        fileExplorerContainer.classList.remove("hidden");
        searchInput.value = "";
        searchResults.innerHTML = "";
    }

    static search(query: string) {
        searchResults.textContent = "";

        if (!query || query.length < 2) return;

        const files = ProjectSystem.getProjectFiles();
        const lowerQuery = query.toLowerCase();
        const fragment = document.createDocumentFragment();
        let totalMatches = 0;
        const MAX_RESULTS = 500;

        for (const file of files) {
            if (!file.isPlaintextFile()) continue;

            // Use live editor content for the active file
            const data = file.isActive()
                ? Editor.getEditorCode()
                : file.getData();
            if (typeof data !== "string") continue;

            const lines = data.split("\n");
            const matches: { line: number; text: string }[] = [];

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].toLowerCase().includes(lowerQuery)) {
                    matches.push({ line: i + 1, text: lines[i].trim() });
                    if (++totalMatches >= MAX_RESULTS) break;
                }
            }

            if (matches.length === 0) continue;

            // File header
            const fileHeader = document.createElement("div");
            fileHeader.className =
                "px-1 py-0.5 font-semibold text-dark-5 dark:text-dark-a text-xs mt-1";
            fileHeader.textContent = `${file.getFilename()} (${matches.length})`;
            fragment.appendChild(fileHeader);

            // Match entries
            for (const match of matches) {
                const entry = document.createElement("button");
                entry.className =
                    "w-full text-left px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-dark-4 " +
                    "rounded cursor-pointer flex items-baseline gap-1 focus:outline-none " +
                    "focus-visible:ring-1 focus-visible:ring-blue-600";

                const lineNum = document.createElement("span");
                lineNum.className =
                    "text-dark-5 dark:text-dark-a text-xs flex-none";
                lineNum.textContent = String(match.line);

                const lineText = document.createElement("span");
                lineText.className = "truncate";
                lineText.innerHTML = highlightMatch(
                    match.text,
                    query
                );

                entry.appendChild(lineNum);
                entry.appendChild(lineText);

                entry.addEventListener("click", () => {
                    ProjectSystem.setActiveFile(file);
                    // Jump to line after a brief delay for the file to load
                    setTimeout(() => {
                        Editor.revealLine(match.line);
                    }, 50);
                });

                fragment.appendChild(entry);
            }

            if (totalMatches >= MAX_RESULTS) break;
        }

        if (fragment.children.length === 0) {
            const noResults = document.createElement("div");
            noResults.className =
                "px-2 py-2 text-dark-5 dark:text-dark-a text-xs";
            noResults.textContent = "No results found";
            fragment.appendChild(noResults);
        }

        searchResults.appendChild(fragment);
    }
}

function highlightMatch(text: string, query: string): string {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return escapeHtml(text);
    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + query.length);
    const after = text.substring(idx + query.length);
    return (
        escapeHtml(before) +
        `<span class="text-orange font-semibold">${escapeHtml(match)}</span>` +
        escapeHtml(after)
    );
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
