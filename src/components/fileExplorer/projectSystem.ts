//--------------------------------------------------------------------
// title: Project System
// desc:  Logic Handling for Project File System
//
//
// author: terry feng
// date:   January 2024
//--------------------------------------------------------------------

import { theChuck } from "@/host";
import {
    File as FileData,
    fetchDataFile,
    fetchTextFile,
    isPlaintextFile,
} from "@/utils/fileLoader";
import Editor from "@/components/editor/monaco/editor";
import Console from "../outputPanel/console";
import ProjectFile from "./projectFile";

export default class ProjectSystem {
    public static newFileButton: HTMLButtonElement;
    public static newProjectButton: HTMLButtonElement;
    public static uploadFilesButton: HTMLButtonElement;
    public static newFileIcon: HTMLButtonElement;
    public static uploadFilesIcon: HTMLButtonElement;
    public static fileExplorerContainer: HTMLDivElement;
    public static fileExplorer: HTMLDivElement;
    public static fileExplorerUploadPrompt: HTMLDivElement;
    public static activeFile: ProjectFile;

    private static projectFiles: Map<string, ProjectFile>;
    private static fileUploader: HTMLInputElement;

    constructor() {
        ProjectSystem.newFileButton =
            document.querySelector<HTMLButtonElement>("#newFile")!;
        ProjectSystem.newFileButton.addEventListener("click", () => {
            ProjectSystem.createNewFile();
        });

        ProjectSystem.fileUploader =
            document.querySelector<HTMLInputElement>("#fileUploader")!;
        ProjectSystem.uploadFilesButton =
            document.querySelector<HTMLButtonElement>("#uploadFiles")!;
        ProjectSystem.uploadFilesButton.addEventListener("click", () => {
            ProjectSystem.fileUploader.click();
        });
        ProjectSystem.fileUploader.addEventListener(
            "change",
            () => {
                ProjectSystem.uploadFiles(ProjectSystem.fileUploader.files);
            },
            false
        );

        ProjectSystem.newProjectButton =
            document.querySelector<HTMLButtonElement>("#newProject")!;
        ProjectSystem.newProjectButton.addEventListener("click", () => {
            ProjectSystem.newProject();
        });

        // File explorer header icon buttons
        ProjectSystem.newFileIcon =
            document.querySelector<HTMLButtonElement>("#newFileIcon")!;
        ProjectSystem.newFileIcon.addEventListener("click", () => {
            ProjectSystem.createNewFile();
        });

        ProjectSystem.uploadFilesIcon =
            document.querySelector<HTMLButtonElement>("#uploadFilesIcon")!;
        ProjectSystem.uploadFilesIcon.addEventListener("click", () => {
            ProjectSystem.fileUploader.click();
        });

        ProjectSystem.fileExplorer =
            document.querySelector<HTMLDivElement>("#fileExplorer")!;
        ProjectSystem.fileExplorerContainer =
            document.querySelector<HTMLDivElement>("#fileExplorerContainer")!;
        ProjectSystem.fileExplorerUploadPrompt =
            document.querySelector<HTMLDivElement>(
                "#fileExplorerUploadPrompt"
            )!;

        ProjectSystem.projectFiles = new Map();
    }

    static size(): number {
        return ProjectSystem.projectFiles.size;
    }

    /**
     * Save all plaintext project files to localStorage
     */
    static saveProject() {
        const files: Record<string, string> = {};
        let activeFilename = "";

        ProjectSystem.projectFiles.forEach((file) => {
            if (file.isPlaintextFile()) {
                const content = file.isActive()
                    ? Editor.getEditorCode()
                    : (file.getData() as string);
                files[file.getFilename()] = content;
            }
            if (file.isActive()) {
                activeFilename = file.getFilename();
            }
        });

        localStorage.setItem(
            "projectFiles",
            JSON.stringify({ activeFile: activeFilename, files })
        );
        localStorage.setItem("editorCodeTime", new Date().toLocaleString());
    }

    /**
     * Load all project files from localStorage
     * @returns true if a saved project was restored
     */
    static loadProject(): boolean {
        const saved = localStorage.getItem("projectFiles");
        if (!saved) return false;

        try {
            const { activeFile, files } = JSON.parse(saved);
            if (!files || Object.keys(files).length === 0) return false;

            for (const [filename, content] of Object.entries(files)) {
                const file = new ProjectFile(filename, content as string);
                ProjectSystem.projectFiles.set(filename, file);
            }

            // Sort files (.ck first)
            const sortedFiles = Array.from(ProjectSystem.projectFiles).sort(
                (a, b) => {
                    if (a[0].endsWith(".ck") && !b[0].endsWith(".ck"))
                        return -1;
                    if (!a[0].endsWith(".ck") && b[0].endsWith(".ck")) return 1;
                    return 0;
                }
            );
            ProjectSystem.projectFiles = new Map(sortedFiles);

            // Set active file
            const active =
                activeFile && ProjectSystem.projectFiles.get(activeFile);
            if (active && active.isPlaintextFile()) {
                ProjectSystem.activeFile = active;
                active.loadFile();
            } else {
                // Fall back to first .ck file
                for (const file of ProjectSystem.projectFiles.values()) {
                    if (file.isChuckFile()) {
                        ProjectSystem.activeFile = file;
                        file.loadFile();
                        break;
                    }
                }
            }

            ProjectSystem.updateFileExplorerUI();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Create a new file via inline rename
     */
    static createNewFile() {
        ProjectSystem.startInlineRename("untitled.ck", true);
    }

    /**
     * Remove the blank "untitled.ck" created at startup, if it exists and is empty.
     * Called when an example is loaded from the welcome screen.
     */
    static removeBlankDefaultFile() {
        const untitled = ProjectSystem.projectFiles.get("untitled.ck");
        if (untitled && untitled.getData() === "") {
            ProjectSystem.projectFiles.delete("untitled.ck");
            ProjectSystem.updateFileExplorerUI();
        }
    }

    /**
     * Add new file to the file system
     * @param filename name of the file
     * @param data data of the file
     */
    static addNewFile(filename: string, data: string | Uint8Array) {
        const newFile = new ProjectFile(filename, data);
        theChuck?.createFile("", filename, data);
        if (isPlaintextFile(filename)) {
            ProjectSystem.setActiveFile(newFile);
        }
        ProjectSystem.addFileToExplorer(newFile);
        ProjectSystem.saveProject();
    }

    /**
     * Set a new file active in the editor
     * @param projectFile file to set as active
     */
    static setActiveFile(projectFile: ProjectFile) {
        if (projectFile.isPlaintextFile()) {
            ProjectSystem.activeFile?.unloadFile();
            ProjectSystem.activeFile = projectFile;
            ProjectSystem.activeFile.loadFile();
            this.updateFileExplorerUI();
        }
    }

    /**
     * Update the active file in the editor
     * @param data data to update the active file with
     */
    static updateActiveFile(data: string) {
        ProjectSystem.activeFile.setData(data);
    }

    /**
     * Add a file to the file explorer UI in the IDE
     * @param projectFile
     */
    static addFileToExplorer(projectFile: ProjectFile) {
        ProjectSystem.projectFiles.set(projectFile.getFilename(), projectFile);

        // sort files that end with .ck first
        const sortedFiles = Array.from(ProjectSystem.projectFiles).sort(
            (a, b) => {
                if (a[0].endsWith(".ck") && !b[0].endsWith(".ck")) {
                    return -1;
                } else if (!a[0].endsWith(".ck") && b[0].endsWith(".ck")) {
                    return 1;
                } else {
                    return 0;
                }
            }
        );
        ProjectSystem.projectFiles = new Map(sortedFiles);
        ProjectSystem.updateFileExplorerUI();
    }

    /**
     * Number of chuck files in the project
     * @returns the number of chuck files in the project
     */
    static numChuckFiles(): number {
        return Array.from(ProjectSystem.projectFiles.values()).reduce(
            (a, v) => (v.isChuckFile() ? a + 1 : a),
            0
        );
    }

    /**
     * Remove a file from the file explorer
     * @param filename file to remove
     */
    static removeFileFromExplorer(filename: string) {
        const wasActive = ProjectSystem.activeFile.isActive();

        ProjectSystem.projectFiles.delete(filename);

        if (ProjectSystem.numChuckFiles() === 0) {
            // must have at least one ck file
            ProjectSystem.addNewFile("untitled.ck", "");
        } else if (ProjectSystem.projectFiles.size === 0) {
            ProjectSystem.clearFileSystem();
            return;
        } else {
            if (wasActive) {
                ProjectSystem.setActiveFile(
                    ProjectSystem.projectFiles.values().next().value!
                );
            }
        }
        ProjectSystem.updateFileExplorerUI();
        ProjectSystem.saveProject();
    }

    /**
     * Rename a file in the project
     */
    static renameFile(oldName: string, newName: string) {
        if (!newName || newName === oldName) return;
        if (ProjectSystem.projectFiles.has(newName)) {
            Console.print(`"${newName}" already exists`);
            return;
        }
        const file = ProjectSystem.projectFiles.get(oldName);
        if (!file) return;
        ProjectSystem.projectFiles.delete(oldName);
        file.rename(newName);
        ProjectSystem.projectFiles.set(newName, file);
        if (file.isActive()) {
            Editor.setFileName(newName);
        }
        ProjectSystem.updateFileExplorerUI();
        ProjectSystem.saveProject();
    }

    /**
     * Update File Explorer UI with project files
     */
    static updateFileExplorerUI() {
        ProjectSystem.fileExplorer.innerHTML = "";
        ProjectSystem.fileExplorer.setAttribute("role", "listbox");
        ProjectSystem.fileExplorer.setAttribute("aria-label", "Project files");

        ProjectSystem.projectFiles.forEach((projectFile) => {
            const fileEntry = document.createElement("div");
            fileEntry.className = "fileExplorerEntry";
            fileEntry.setAttribute("tabindex", "0");
            fileEntry.setAttribute("role", "option");
            fileEntry.setAttribute(
                "aria-selected",
                String(projectFile.isActive())
            );

            // File Info (icon + name)
            const fileItem = document.createElement("div");
            const filename = projectFile.getFilename();
            const fileExt = filename.split(".").pop()!;
            fileItem.className = "fileExplorerItem";
            fileItem.setAttribute("type", fileExt);
            fileItem.innerHTML += filename;

            // Arm File Entry
            fileEntry.appendChild(fileItem);
            if (projectFile.isActive()) {
                fileEntry.classList.add("active");
            }
            fileEntry.addEventListener("click", () => {
                ProjectSystem.setActiveFile(projectFile);
            });
            fileEntry.addEventListener("keydown", (e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    ProjectSystem.setActiveFile(projectFile);
                }
            });

            // Right-click context menu
            fileEntry.addEventListener("contextmenu", (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                ProjectSystem.showContextMenu(e.clientX, e.clientY, filename);
            });

            // Long-press context menu for touch devices
            let longPressTimer: ReturnType<typeof setTimeout> | null = null;
            let longPressFired = false;
            fileEntry.addEventListener(
                "touchstart",
                (e: TouchEvent) => {
                    longPressFired = false;
                    const touch = e.touches[0];
                    const startX = touch.clientX;
                    const startY = touch.clientY;
                    longPressTimer = setTimeout(() => {
                        longPressFired = true;
                        ProjectSystem.showContextMenu(
                            startX,
                            startY,
                            filename
                        );
                    }, 500);
                    // Cancel on move
                    const moveHandler = (me: TouchEvent) => {
                        const dx = me.touches[0].clientX - startX;
                        const dy = me.touches[0].clientY - startY;
                        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                            if (longPressTimer) clearTimeout(longPressTimer);
                            longPressTimer = null;
                            fileEntry.removeEventListener(
                                "touchmove",
                                moveHandler
                            );
                        }
                    };
                    fileEntry.addEventListener("touchmove", moveHandler, {
                        passive: true,
                    });
                },
                { passive: true }
            );
            fileEntry.addEventListener("touchend", () => {
                if (longPressTimer) clearTimeout(longPressTimer);
                longPressTimer = null;
            });
            // Suppress click after long-press
            fileEntry.addEventListener(
                "click",
                (e: MouseEvent) => {
                    if (longPressFired) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        longPressFired = false;
                    }
                },
                true
            );

            ProjectSystem.fileExplorer.appendChild(fileEntry);
        });
    }

    /**
     * Show a context menu for a file entry
     */
    private static activeContextMenu: HTMLDivElement | null = null;

    static showContextMenu(x: number, y: number, filename: string) {
        ProjectSystem.hideContextMenu();

        const menu = document.createElement("div");
        menu.className = "fileContextMenu";
        menu.setAttribute("role", "menu");

        const renameItem = document.createElement("button");
        renameItem.className = "fileContextMenuItem";
        renameItem.textContent = "Rename";
        renameItem.setAttribute("role", "menuitem");
        renameItem.addEventListener("click", () => {
            ProjectSystem.hideContextMenu();
            ProjectSystem.startInlineRename(filename);
        });

        const deleteItem = document.createElement("button");
        deleteItem.className =
            "fileContextMenuItem fileContextMenuItem--delete";
        deleteItem.textContent = "Delete";
        deleteItem.setAttribute("role", "menuitem");
        deleteItem.addEventListener("click", () => {
            ProjectSystem.hideContextMenu();
            ProjectSystem.removeFileFromExplorer(filename);
        });

        menu.appendChild(renameItem);
        menu.appendChild(deleteItem);

        // Position, clamped to viewport
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        document.body.appendChild(menu);

        // Clamp to viewport after measuring
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = `${window.innerWidth - rect.width - 4}px`;
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = `${window.innerHeight - rect.height - 4}px`;
        }

        ProjectSystem.activeContextMenu = menu;

        // Close on click/tap outside or Escape
        const cleanup = () => {
            document.removeEventListener("mousedown", mouseCloseHandler);
            document.removeEventListener("touchend", touchCloseHandler);
            document.removeEventListener("keydown", escHandler);
        };
        const mouseCloseHandler = (e: MouseEvent) => {
            if (!menu.contains(e.target as Node)) {
                ProjectSystem.hideContextMenu();
                cleanup();
            }
        };
        const touchCloseHandler = (e: TouchEvent) => {
            const touch = e.changedTouches[0];
            const target = document.elementFromPoint(
                touch.clientX,
                touch.clientY
            );
            if (!target || !menu.contains(target)) {
                ProjectSystem.hideContextMenu();
                cleanup();
            }
        };
        const escHandler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                ProjectSystem.hideContextMenu();
                cleanup();
            }
        };
        // Defer so the current event doesn't immediately close it
        requestAnimationFrame(() => {
            document.addEventListener("mousedown", mouseCloseHandler);
            document.addEventListener("touchend", touchCloseHandler, {
                passive: true,
            });
            document.addEventListener("keydown", escHandler);
        });

        renameItem.focus();
    }

    static hideContextMenu() {
        if (ProjectSystem.activeContextMenu) {
            ProjectSystem.activeContextMenu.remove();
            ProjectSystem.activeContextMenu = null;
        }
    }

    /**
     * Start inline rename editing on a file entry in the explorer
     * @param filename current filename (or default name for new files)
     * @param isNewFile true when creating a new file
     */
    static startInlineRename(filename: string, isNewFile: boolean = false) {
        let fileEntry: HTMLDivElement | null = null;
        let fileItem: HTMLDivElement | null = null;

        if (isNewFile) {
            // Create a temporary DOM entry for the new file
            fileEntry = document.createElement("div");
            fileEntry.className = "fileExplorerEntry";
            fileEntry.setAttribute("tabindex", "0");
            fileEntry.setAttribute("role", "option");
            fileEntry.setAttribute("aria-selected", "false");

            fileItem = document.createElement("div");
            fileItem.className = "fileExplorerItem";
            fileItem.setAttribute("type", "ck");
            fileEntry.appendChild(fileItem);

            // Insert at the top of the file explorer
            ProjectSystem.fileExplorer.prepend(fileEntry);
        } else {
            // Find the existing entry by matching filename text
            const entries = Array.from(
                ProjectSystem.fileExplorer.querySelectorAll(
                    ".fileExplorerEntry"
                )
            );
            for (const entry of entries) {
                const item = entry.querySelector(".fileExplorerItem");
                if (item && item.textContent?.trim() === filename) {
                    fileEntry = entry as HTMLDivElement;
                    fileItem = item as HTMLDivElement;
                    break;
                }
            }
        }

        if (!fileEntry || !fileItem) return;

        // Replace text content with an input
        fileItem.textContent = "";
        const input = document.createElement("input");
        input.type = "text";
        input.className = "fileExplorerRenameInput";
        input.value = filename;
        fileItem.appendChild(input);

        // Select the filename stem (before the last dot)
        input.focus();
        const dotIndex = filename.lastIndexOf(".");
        if (dotIndex > 0) {
            input.setSelectionRange(0, dotIndex);
        } else {
            input.select();
        }

        let done = false;

        const commit = () => {
            if (done) return;
            done = true;

            const newName = input.value.trim();

            if (isNewFile) {
                if (!newName) {
                    fileEntry!.remove();
                    return;
                }
                const hasExtension = newName.includes(".");
                const finalName = hasExtension ? newName : newName + ".ck";
                if (ProjectSystem.projectFiles.has(finalName)) {
                    Console.print(`${finalName} already exists`);
                    fileEntry!.remove();
                    return;
                }
                const newFile = new ProjectFile(finalName, "");
                if (newFile.isChuckFile()) {
                    ProjectSystem.setActiveFile(newFile);
                }
                ProjectSystem.addFileToExplorer(newFile);
            } else {
                if (!newName || newName === filename) {
                    // No change — restore original text
                    fileItem!.textContent = filename;
                    return;
                }
                if (ProjectSystem.projectFiles.has(newName)) {
                    Console.print(`"${newName}" already exists`);
                    fileItem!.textContent = filename;
                    return;
                }
                ProjectSystem.renameFile(filename, newName);
            }
        };

        const cancel = () => {
            if (done) return;
            done = true;
            if (isNewFile) {
                fileEntry!.remove();
            } else {
                fileItem!.textContent = filename;
            }
        };

        input.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                commit();
            } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
            }
            e.stopPropagation();
        });

        input.addEventListener("blur", () => {
            commit();
        });

        // Prevent clicks on the input from triggering file selection
        input.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        input.addEventListener("mousedown", (e) => {
            e.stopPropagation();
        });
    }

    /**
     * Create a new project and clear the file system
     * Warn that current project will be lost
     */
    static newProject() {
        // Warn that current project will be lost
        if (
            confirm("Create a new project? You will lose your current files.")
        ) {
            ProjectSystem.clearFileSystem();
        }
    }

    /**
     * Clear the file system
     */
    static clearFileSystem() {
        // delete all files
        ProjectSystem.projectFiles.clear();
        ProjectSystem.fileUploader.value = "";
        const newFile = new ProjectFile("untitled.ck", "");
        ProjectSystem.setActiveFile(newFile);
        ProjectSystem.addFileToExplorer(newFile);
        ProjectSystem.saveProject();
    }

    /**
     * Upload files to the file system
     */
    static uploadFiles(files: FileList | null) {
        // Handle multiple files uploaded
        const fileList: FileList | null = files;
        if (fileList === null || fileList.length === 0) {
            return;
        }

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const reader = new FileReader();
            if (isPlaintextFile(file.name)) {
                reader.onload = (e) => {
                    const data = e.target!.result as string;

                    // If chuck is already running, create file
                    if (theChuck !== undefined) {
                        if (file.name.endsWith(".ck")) {
                            Console.print("loaded ChucK file: " + file.name);
                        } else {
                            Console.print("loaded file: " + file.name);
                        }
                        ProjectSystem.addNewFile(file.name, data);
                    }
                };
                reader.readAsText(file);
            } else {
                reader.onload = function (e) {
                    const data = new Uint8Array(
                        e.target!.result as ArrayBuffer
                    );

                    // If chuck is already running, create file
                    if (theChuck !== undefined) {
                        Console.print("loaded file: " + file.name);
                        ProjectSystem.addNewFile(file.name, data);
                    }
                };
                reader.readAsArrayBuffer(file);
            }
        }
    }

    /**
     * Get the project files
     * @returns the project files
     */
    static getProjectFiles(): ProjectFile[] {
        return Array.from(ProjectSystem.projectFiles.values());
    }

    /**
     * Initialize drag and drop upload support
     */
    static initDragUpload() {
        ProjectSystem.fileExplorerContainer.addEventListener(
            "dragover",
            (e) => {
                e.preventDefault();
                ProjectSystem.fileExplorerUploadPrompt.classList.replace(
                    "opacity-0",
                    "opacity-100"
                );
            }
        );
        // end drag
        ProjectSystem.fileExplorerContainer.addEventListener(
            "dragleave",
            (e) => {
                e.preventDefault();
                ProjectSystem.fileExplorerUploadPrompt.classList.replace(
                    "opacity-100",
                    "opacity-0"
                );
            }
        );
        ProjectSystem.fileExplorerContainer.addEventListener("dragend", (e) => {
            e.preventDefault();
            ProjectSystem.fileExplorerUploadPrompt.classList.replace(
                "opacity-100",
                "opacity-0"
            );
        });
        // drop
        ProjectSystem.fileExplorerContainer.addEventListener("drop", (e) => {
            e.preventDefault();
            ProjectSystem.dragUploadFiles(e);
            ProjectSystem.fileExplorerUploadPrompt.classList.replace(
                "opacity-100",
                "opacity-0"
            );
        });
    }

    /**
     * Upload files to the file system via drag and drop
     * @param event file drag event
     */
    static dragUploadFiles(event: DragEvent) {
        if (event.dataTransfer?.files.length === 0) {
            return;
        }

        let fileList: File[];

        // Populate fileList with files from event
        if (event.dataTransfer?.items) {
            // event.dataTransfer.items only supported by Chrome
            fileList = Array.from(event.dataTransfer?.items)
                .map((item) => {
                    if (item.kind === "file") {
                        return item.getAsFile();
                    }
                    return null;
                })
                .filter((file): file is File => file !== null);
        } else {
            fileList = Array.from(event.dataTransfer!.files);
        }

        // Loop through the FileList and load files into IDE/ChucK
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const reader = new FileReader();
            if (isPlaintextFile(file.name)) {
                reader.onload = (e) => {
                    const data = e.target!.result as string;
                    if (file.name.endsWith(".ck")) {
                        Console.print("loaded ChucK file: " + file.name);
                    } else {
                        Console.print("loaded file: " + file.name);
                    }
                    ProjectSystem.addNewFile(file.name, data as string);
                };
                reader.readAsText(file);
            } else {
                reader.onload = function (e) {
                    const data = new Uint8Array(
                        e.target!.result as ArrayBuffer
                    );
                    Console.print("loaded file: " + file.name);
                    ProjectSystem.addNewFile(file.name, data as Uint8Array);
                };
                reader.readAsArrayBuffer(file);
            }
        }
    }
}

//----------------------------------------
// Helper Functions
//----------------------------------------
/**
 * Load a chuck file from a url
 * @param url url to fetch example from
 */
export async function loadChuckFileFromURL(url: string) {
    const chuckFile: FileData = await fetchTextFile(url);
    ProjectSystem.removeBlankDefaultFile();
    ProjectSystem.addNewFile(chuckFile.name, chuckFile.data as string);
    Console.print(`loaded ChucK file: ${chuckFile.name}`);
}

/**
 * Load a data file from a url
 * @param url url to data file
 */
export async function loadDataFileFromURL(url: string) {
    const dataFile: FileData | null = await fetchDataFile(url);
    if (dataFile !== null) {
        ProjectSystem.addNewFile(dataFile.name, dataFile.data as Uint8Array);
        Console.print(`loaded file: ${dataFile.name}`);
    }
}
