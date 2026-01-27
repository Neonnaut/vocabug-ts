import { examples } from './examples';

const cm6 = (window as any).cm6; // This was global. Stops TS from complaining

const w = new Worker('./worker.js', { type: 'module' });

import { VERSION } from '../../src/utils/version';

function create_file_editor() {
    // Work out content and theme of file editor
    let content = '';
    let theme = 'dark';
    if (localStorage.hasOwnProperty('nesca')) {
        try {
            const got_LocalStorage = JSON.parse(localStorage.getItem('nesca') || '[]') as [string, string, string, string, string, string];
            content = got_LocalStorage[0];
        } catch {
            localStorage.removeItem("nesca");
            content = examples.default.file;
        }
    } else {
        content = examples.default.file;
    }
    if (localStorage.hasOwnProperty('colourScheme')) {
        if (localStorage.getItem('colourScheme') != 'dark-mode') {
            theme = 'light'
        }
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        theme = 'light';
    }

    // Create file editor
    return cm6.createEditorView(
        cm6.createEditorState(content, theme, "nesca"),
        document.getElementById("editor")
    );
}

window.addEventListener("load", () => {
    const editor = create_file_editor();

    if (localStorage.hasOwnProperty('nesca')) {
        try {
            const got_LocalStorage = JSON.parse(localStorage.getItem('nesca') || '[]') as [string, string, string, string, string, string];
            let filename = got_LocalStorage[1];
            set_filename(filename);

            let input_words = got_LocalStorage[2];
            (document.getElementById('nesca-word-input') as HTMLInputElement).value = input_words;

            let input_divider = got_LocalStorage[3];
            (document.getElementById('nesca-input-divider') as HTMLInputElement).value = input_divider;

            let output_divider = got_LocalStorage[4];
            (document.getElementById('nesca-output-divider') as HTMLInputElement).value = output_divider;

            let mode = got_LocalStorage[5];
            const my_mode = document.getElementById('my_mode') as HTMLSelectElement | null;
            if (!my_mode) {throw new Error}
            for (const option of Array.from(my_mode.options)) {
                if (mode === option.value) {
                    option.selected = true;
                }
            }

            mode_buttons();
        } catch {
            localStorage.removeItem("nesca");
            (document.getElementById('nesca-word-input') as HTMLInputElement).value = examples.default.input_words;
        }
    } else {
        (document.getElementById('nesca-word-input') as HTMLInputElement).value = examples.default.input_words;
    }

    editor.dispatch({
        selection: { anchor: editor.state.doc.length }
    })

    const defaultButton = document.getElementById("system-mode");
    switch (storedScheme) {
        case "light-mode":
            colourSchemeButtons(document.getElementById("light-mode")!);
            cm6.changeEditorTheme(editor, "light");
            break;
        case "dark-mode":
            colourSchemeButtons(document.getElementById("dark-mode")!);
            cm6.changeEditorTheme(editor, "dark");
            break;
        case "warm-mode":
            colourSchemeButtons(document.getElementById("warm-mode")!);
            cm6.changeEditorTheme(editor, "warm");
            break;
        default:
            if (defaultButton) colourSchemeButtons(defaultButton);
            break;
    }

    const themeButtons: NodeListOf<HTMLElement> = document.querySelectorAll("[name='changeThemeButton']");
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const myID = button.id;

            switch (myID) {
                case "light-mode":
                    localStorage.setItem("colourScheme", "light-mode");
                    assignSchemeClass("light-mode");
                    cm6.changeEditorTheme(editor, "light");
                    break;
                case "dark-mode":
                    localStorage.setItem("colourScheme", "dark-mode");
                    assignSchemeClass("dark-mode");
                    cm6.changeEditorTheme(editor, "dark");
                    break;
                case "warm-mode":
                    localStorage.setItem("colourScheme", "warm-mode");
                    assignSchemeClass("warm-mode");
                    cm6.changeEditorTheme(editor, "warm");
                    break;
                default:
                    localStorage.removeItem("colourScheme");
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                        assignSchemeClass("light-mode");
                        cm6.changeEditorTheme(editor, "light");
                    } else {
                        assignSchemeClass("dark-mode");
                        cm6.changeEditorTheme(editor, "dark");
                    }
                    break;
            }

            colourSchemeButtons(button);
        });
    });

    const mainMenu = document.getElementById("main_menu");
    if (mainMenu) {
        mainMenu.addEventListener('click', () => {
            window.location.href = './index.html';
        });
    }

    // Watch for dark / light change in system settings for system theme people
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (!localStorage.hasOwnProperty('colourScheme')) {
            let scheme = event.matches ? "dark" : "light";
            if (scheme == "dark") {
                cm6.changeEditorTheme(editor, "dark");
                document.getElementById("colour-target")?.classList.remove("light-mode");
            } else if (scheme == "light") {
                cm6.changeEditorTheme(editor, "light");
                document.getElementById("colour-target")?.classList.add("light-mode");
            }
        }
    });

    // Apply button(s)
    document.querySelectorAll(".action-btn")?.forEach(btn => {
    btn.addEventListener("click", function () {
        const apply_buttons = Array.from(document.querySelectorAll(".action-btn")) as HTMLButtonElement[];
        const output_message = document.getElementById('prog-output-message') as HTMLDivElement;

        // Disable all apply buttons
        apply_buttons.forEach(b => b.disabled = true);

        const output_message_html = `<p class='grey-message'>Transforming words with Nesca version ${VERSION}...</p>`;
        output_message.innerHTML = output_message_html;

        try {
            w.postMessage({
                file: editor.state.doc.toString(),
                input_words: (document.getElementById('nesca-word-input') as HTMLTextAreaElement)?.value || "",
                input_divider: (document.getElementById('nesca-input-divider') as HTMLInputElement)?.value || "",
                output_divider: (document.getElementById('nesca-output-divider') as HTMLInputElement)?.value || "",
                sort_words: (document.getElementById('sort-words') as HTMLInputElement)?.checked || false,
                mode: (document.getElementById("my_mode") as HTMLSelectElement)?.value || "",
            });
            w.onerror = function (e: ErrorEvent) {
                // Re-enable all apply buttons
                apply_buttons.forEach(b => b.disabled = false);

                const error_message = e instanceof Error ? e.message : String(e);
                output_message.innerHTML = `<p class='error-message'>${error_message}</p>`;
                output_message.focus();
            };

        } catch (e) {
            // Re-enable all apply buttons
            apply_buttons.forEach(b => b.disabled = false);

            const error_message = e instanceof Error ? e.message : String(e);
            output_message.innerHTML = `<p class='error-message'>${error_message}</p>`;
            output_message.focus();
        }
    })
    });

    // After applying words 
    w.onmessage = (e: MessageEvent) => {
        const outputWordsField = document.getElementById('nesca-word-output') as HTMLInputElement;
        const outputMessage = document.getElementById('prog-output-message') as HTMLDivElement;
        const filenameInput = document.getElementById('file-name') as HTMLInputElement;
        const apply_buttons = Array.from(document.querySelectorAll(".action-btn")) as HTMLButtonElement[];
        const input_words = document.getElementById('nesca-word-input') as HTMLInputElement;
        const input_divider = document.getElementById('nesca-input-divider') as HTMLInputElement;
        const output_divider = document.getElementById('nesca-output-divider') as HTMLInputElement;
        const mode_input = document.getElementById('my_mode') as HTMLSelectElement;

        if (outputWordsField) {
            // Transfer words to the output
            outputWordsField.value = e.data.words;
            outputWordsField.focus();
        }

        const filename = filenameInput?.value || "";

        let output_message_html = '';

        if (e.data.warning_messages.length != 0) {
            for (const message of e.data.warning_messages) {
                output_message_html += `<p class='warning-message'>${message}</p>`;
                console.warn(message);
            }
        }
        if (e.data.error_messages.length != 0) {
            for (const message of e.data.error_messages) {
                output_message_html += `<p class='error-message'>${message}</p>`;
                console.error(message);
            }
        }
        if (e.data.info_messages.length != 0) {
            for (const message of e.data.info_messages) {
                output_message_html += `<p class='info-message'>${message}</p>`;
                console.info(message);
            }
        }
        if (e.data.diagnostic_messages.length != 0) {
            for (const message of e.data.diagnostic_messages) {
                console.debug(message);
            }
        }
        outputMessage.innerHTML += output_message_html;

        // Store file contents in local storage to be retrieved on page refresh
        localStorage.setItem('nesca', JSON.stringify([
            e.data.file,
            filename,
            input_words?.value,
            input_divider?.value,
            output_divider?.value,
            mode_input?.value,
        ]));

        // Re-enable all apply buttons
        apply_buttons.forEach(b => b.disabled = false);
    };

    // Copy results button
    document.getElementById("nesca-copy")?.addEventListener("click", () => {
        const outputWordsField = document.getElementById("nesca-word-output") as HTMLTextAreaElement;
        
        if (outputWordsField && outputWordsField.value !== "") {
            // Select text for deprecated way and aesthetics
            outputWordsField.select();
            outputWordsField.setSelectionRange(0, 99999); // For mobile devices
            outputWordsField.focus();

            if (!navigator.clipboard) {
                document.execCommand("copy"); // Deprecated way
            } else {
                navigator.clipboard.writeText(outputWordsField.value);
            }
        }
    });

    // Clear button
    const clearButton = document.getElementById("clear-editor") as HTMLButtonElement | null;
    clearButton?.addEventListener("click", () => {
        const confirmed = window.confirm("Clear ALL FIELDS?");
        if (confirmed) {
            editor.dispatch({
                changes: {
                    from: 0,
                    to: editor.state.doc.length,
                    insert: ''
                }
            });
            set_filename('');
            clear_results();
        }
    });

    // Help button
    const helpButton = document.getElementById("nesca-help") as HTMLButtonElement | null;
    helpButton?.addEventListener("click", () => {
        window.open('./nesca_docs.html', '_blank');
    });


    // Load input words button
    const input_button = document.getElementById("nesca-import-input") as HTMLButtonElement | null;

    input_button?.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";

        input.onchange = () => {
            const file_input = input.files?.[0];
            if (!file_input) return;

            const reader = new FileReader();
            reader.readAsText(file_input);

            reader.onloadend = () => {
                const file_text = reader.result;
                if (typeof file_text !== "string") return;

                const inputWordsField = document.getElementById("nesca-word-input") as HTMLTextAreaElement;
                inputWordsField.value = file_text;
                 
            };
        };

        input.click();
    });

    // Download results button
    document.getElementById("nesca-output-words-download")?.addEventListener("click", () => {
        const output_words_field = document.getElementById("nesca-word-output") as HTMLTextAreaElement;
        
        if (output_words_field && output_words_field.value !== "") {
            const file_content = output_words_field.value;
            const blob = new Blob([file_content], { type: "text/plain" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);

            const raw_name = file_name_input?.value || "";
            const download_name = raw_name === "" ? "nesca_output_words.txt" : `${raw_name}_output_words.txt`;

            link.download = download_name;
            link.click();
            URL.revokeObjectURL(link.href);
        }
    });

    // Wrap lines checkbox
    const wrap_lines_checkbox = document.getElementById("editor-wrap-lines") as HTMLInputElement | null;
    wrap_lines_checkbox?.addEventListener("click", () => {
        if (wrap_lines_checkbox.checked) {
            cm6.changeEditorLineWrap(editor, true);
        } else {
            cm6.changeEditorLineWrap(editor, false);
        }
    });

    // Check mode button click
    const selectElement = document.getElementById("my_mode") as HTMLSelectElement;
    selectElement.addEventListener("change", (event) => {
        mode_buttons();
    });

    // Load file button
    const load_button = document.getElementById("load-file") as HTMLButtonElement | null;

    load_button?.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";

        input.onchange = () => {
            const file_input = input.files?.[0];
            if (!file_input) return;

            const reader = new FileReader();
            reader.readAsText(file_input);

            reader.onloadend = () => {
                const file_text = reader.result;
                if (typeof file_text !== "string") return;

                const filename = file_input.name.replace(/\.[^/.]+$/, "");
                set_filename(filename);

                editor.dispatch({
                    changes: {
                        from: 0,
                        to: editor.state.doc.length,
                        insert: file_text
                    }
                });
                localStorage.setItem("nesca", JSON.stringify([file_text, filename]));
            };
        };

        input.click();
    });

    // Save file button
    const save_button = document.getElementById("save-file") as HTMLButtonElement | null;
    const file_name_input = document.getElementById("file-name") as HTMLInputElement | null;
    save_button?.addEventListener("click", () => {
        const file_content = editor.state.doc.toString();
        const blob = new Blob([file_content], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);

        const raw_name = file_name_input?.value || "";
        const download_name = raw_name === "" ? "nesca.txt" : `${raw_name}.txt`;

        link.download = download_name;
        link.click();
        URL.revokeObjectURL(link.href);

        // Save input text in user's local storage for the next session
        localStorage.setItem("nesca", JSON.stringify([file_content, raw_name]));
    });

    // Examples buttons
    document.querySelectorAll(".nesca-example").forEach((button) => {
        button.addEventListener("click", () => {
            const choice:string = (button as HTMLElement).getAttribute("value") || '?';
            const text = examples[choice].file;
            const confirmed = window.confirm("Replace EDITOR TEXT and INPUT WORDS with example?");
            
            if (confirmed) {
                editor.dispatch({
                    changes: {
                        from: 0,
                        to: editor.state.doc.length,
                        insert: text
                    }
                });
            }
            set_filename('');
            clear_results();

            var i_w = document.getElementById('nesca-word-input') as HTMLInputElement;
            i_w.value = examples[choice].input_words;
        });
    });    

    // Show keyboard toggle
    document.getElementById("show-keyboard-section")?.addEventListener("click", () => {
        const keyboard_table = document.getElementById("select-keyboard-section") as HTMLDivElement;
        const checkbox = document.getElementById('show-keyboard-section') as HTMLInputElement;
        
        if (keyboard_table && checkbox) {
            if (checkbox.checked) {
                keyboard_table.style.display = "block";
                window.location.href = "#select-keyboard-section";
            } else {
                keyboard_table.style.display = "none";
            }
        }
    });

    // IPA buttons
    document.querySelectorAll(".keyboard-button").forEach((button) => {
    const el = button as HTMLButtonElement; // or HTMLElement if more generic
    el.addEventListener("mousedown", (e) => {
        const mouse = e as MouseEvent;
        if (mouse.button === 0) {
            mouse.preventDefault();
            editor.dispatch({
                changes: {
                from: editor.state.selection.main.head,
                insert: el.getAttribute("value") ?? "",
                },
                selection: { anchor: editor.state.selection.main.head + 1 },
                scrollIntoView: true,
            });
            }
        });
    });

    const divider = document.getElementById("nesca-divider") as HTMLDivElement;
    const container = document.getElementById("nesca-container") as HTMLDivElement;
    const leftPane = container.children[0] as HTMLDivElement;
    let isDragging = false;

    divider.addEventListener("mousedown", () => {
        if (window.innerWidth < 600) return;
        isDragging = true;
        document.body.style.cursor = "col-resize";
    });
    document.addEventListener("mouseup", () => {
        if (window.innerWidth < 600) return;
        isDragging = false;
        document.body.style.cursor = "default";
    });
    document.addEventListener("mousemove", (e) => {
        if (window.innerWidth < 600) return;
        if (!isDragging) return;

        const rect = container.getBoundingClientRect();
        const newLeftWidth = e.clientX - rect.left;

        // Prevent collapsing
        if (newLeftWidth < 190 || newLeftWidth > rect.width - 110) return;

        leftPane.style.flex = "none";
        leftPane.style.width = newLeftWidth + "px";
    });

    window.addEventListener("resize", () => {
    if (window.innerWidth < 600) {
        leftPane.style.removeProperty("width");
        leftPane.style.removeProperty("flex");
        return;
    }

        const containerWidth = container.getBoundingClientRect().width;
        const leftWidth = leftPane.getBoundingClientRect().width;

        // Maximum allowed left width so right pane never collapses
        const maxLeft = containerWidth - 110;

        // If left pane is too wide for the new container size, shrink it
        if (leftWidth > maxLeft) {
            leftPane.style.width = `190px`;
            leftPane.style.flex = "none";
        }

        // If left pane is too small, enforce its minimum
        if (leftWidth < 110) {
            leftPane.style.width = `110px`;
            leftPane.style.flex = "none";
        }
    });
});

function clear_results(): void {
    (document.getElementById('prog-output-message') as HTMLDivElement).innerHTML = "<p class='grey-message'>Information may be shown here...</p>";
    (document.getElementById('nesca-word-input') as HTMLInputElement).value = "";
    (document.getElementById('nesca-word-output') as HTMLInputElement).value = "";
}

function set_filename(filename: string): void {
    (document.getElementById('file-name') as HTMLInputElement).value = filename;
}

function mode_buttons() {
    // Mode buttons
    const selectElement = document.getElementById("my_mode") as HTMLSelectElement;
    const sort_words = document.getElementById("sort-words") as HTMLInputElement;
    const output_divider = (document.getElementById('nesca-output-divider') as HTMLInputElement);

    const selectedValue = selectElement.value;
    switch (selectedValue) {
        case "debug":
            if (sort_words){
                sort_words.disabled = true;
                output_divider.disabled = true;
            }
            break;
        default:
            if (sort_words){
                sort_words.disabled = false;
                output_divider.disabled = false;
            }
            break;
    }

}



function colourSchemeButtons(clickedElement: HTMLElement): void {
    const selection: NodeListOf<HTMLAnchorElement> = document.querySelectorAll("#colour-switch-field button");
    selection.forEach(el => el.classList.remove('checked'));
    clickedElement.classList.add("checked");
}
function assignSchemeClass(scheme: string): void {
    const mySchemes: string[] = ["light-mode", "dark-mode", "warm-mode"];
    const target = document.getElementById("colour-target");

    if (!target) return;

    mySchemes.forEach(mode => {
        if (scheme !== mode) {
            target.classList.remove(mode);
        } else {
            target.classList.add(mode);
        }
    });
}

// Initial scheme assignment
const storedScheme = localStorage.getItem('colourScheme');
if (storedScheme) {
    assignSchemeClass(storedScheme);
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    assignSchemeClass('light-mode');
}

window.addEventListener('DOMContentLoaded', () => {

});


