import { examples } from './examples';

const cm6 = (window as any).cm6; // This was global. Stops TS from complaining

const w = new Worker('./worker.js', { type: 'module' });

import { VOCABUG_VERSION } from '../src/utils/vocabug-version';

function create_file_editor() {
    // Work out content and theme of file editor
    let content = '';
    let theme = 'dark';
    if (localStorage.hasOwnProperty('vocabug')) {
        try {
            const got_LocalStorage = JSON.parse(localStorage.getItem('vocabug') || '[]') as [string, string, string, string, string];
            content = got_LocalStorage[0];
        } catch {
            localStorage.removeItem("vocabug");
            content = examples.default;
        }
    } else {
        content = examples.default;
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
        cm6.createEditorState(content, theme),
        document.getElementById("editor")
    );
}

window.addEventListener("load", () => {
    const editor = create_file_editor();

    if (localStorage.hasOwnProperty('vocabug')) {
        try {
            const got_LocalStorage = JSON.parse(localStorage.getItem('vocabug') || '[]') as [string, string, string, string, string];
            let filename = got_LocalStorage[1];
            set_filename(filename);

            let numwords = got_LocalStorage[2];
            (document.getElementById('num-of-words') as HTMLInputElement).value = numwords;

            let mode = got_LocalStorage[3];
            const my_mode = document.getElementById('my_mode') as HTMLSelectElement | null;
            if (!my_mode) {throw new Error}
            for (const option of Array.from(my_mode.options)) {
                if (mode === option.value) {
                    option.selected = true;
                }
            }
            
            let worddivider = got_LocalStorage[4] || " ";
            (document.getElementById('word-divider') as HTMLInputElement).value = worddivider;

            mode_buttons();
        } catch {
            localStorage.removeItem("vocabug");
        }
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
    
    // Generate button(s)
    document.querySelectorAll(".generate-words")?.forEach(btn => {
        btn.addEventListener("click", function () {
            const generate_buttons = Array.from(document.querySelectorAll(".generate-words")) as HTMLButtonElement[];
            const output_message = document.getElementById('prog-output-message') as HTMLDivElement;

            // Disable all generate buttons
            generate_buttons.forEach(b => b.disabled = true);

            const output_message_html = `<p class='grey-message'>Generating words with Vocabug version ${VOCABUG_VERSION}. This may take up to 30 seconds...</p>`;
            output_message.innerHTML = output_message_html;

            try {
                w.postMessage({
                    file: editor.state.doc.toString(),
                    num_of_words: (document.getElementById('num-of-words') as HTMLInputElement)?.value || "",
                    mode: (document.getElementById("my_mode") as HTMLSelectElement)?.value || "",
                    remove_duplicates: (document.getElementById('remove-duplicates') as HTMLInputElement)?.checked || false,
                    force_word_limit: (document.getElementById('force-words') as HTMLInputElement)?.checked || false,
                    sort_words: (document.getElementById('sort-words') as HTMLInputElement)?.checked || false,
                    word_divider: (document.getElementById('word-divider') as HTMLInputElement)?.value || ""
                });

                w.onerror = function (e: ErrorEvent) {
                    // Re-enable all generate buttons
                    generate_buttons.forEach(b => b.disabled = false);

                    output_message.innerHTML = `<p class='error-message'>${e.message}</p>`;
                    output_message.focus();
                };

            } catch (e) {
                // Re-enable all generate buttons
                generate_buttons.forEach(b => b.disabled = false);

                const error_message = e instanceof Error ? e.message : String(e);
                output_message.innerHTML = `<p class='error-message'>${error_message}</p>`;
                output_message.focus();
            }
        });
    });

    // After generating words
    w.onmessage = (e: MessageEvent) => {
        const output_words_field = document.getElementById('voc-output-words-field') as HTMLInputElement;
        const output_message = document.getElementById('prog-output-message') as HTMLDivElement;
        const filename_input = document.getElementById('file-name') as HTMLInputElement;
        const num_of_words_input = document.getElementById('num-of-words') as HTMLInputElement;
        const word_divider_input = document.getElementById('word-divider') as HTMLInputElement;
        const mode_input = document.getElementById('my_mode') as HTMLSelectElement;

        const generate_buttons = Array.from(document.querySelectorAll(".generate-words")) as HTMLButtonElement[];

        if (output_words_field) {
            output_words_field.value = e.data.words;
            output_words_field.focus();
        }

        const filename = filename_input?.value || "";
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

        output_message.innerHTML += output_message_html;
        output_message.focus();

        // Store file contents in local storage to be retrieved on page refresh
        localStorage.setItem('vocabug', JSON.stringify([
            e.data.file,
            filename,
            num_of_words_input?.value,
            mode_input?.value,
            word_divider_input?.value
        ]));

        // Re-enable all generate buttons
        generate_buttons.forEach(b => b.disabled = false);
    };

    // Copy results button
    document.getElementById("output-words-copy")?.addEventListener("click", () => {
        const output_words_field = document.getElementById("voc-output-words-field") as HTMLTextAreaElement;
        
        if (output_words_field && output_words_field.value !== "") {
            // Select text for deprecated way and aesthetics
            output_words_field.select();
            output_words_field.setSelectionRange(0, 99999); // For mobile devices
            output_words_field.focus();

            if (!navigator.clipboard) {
                document.execCommand("copy"); // Deprecated way
            } else {
                navigator.clipboard.writeText(output_words_field.value);
            }
        }
    });

    // Clear button
    const clear_button = document.getElementById("clear-editor") as HTMLButtonElement | null;
    clear_button?.addEventListener("click", () => {
        const confirmed = window.confirm("Clear EDITOR TEXT and GENERATED WORDS?");
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
                localStorage.setItem("vocabug", JSON.stringify([file_text, filename]));
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
        const download_name = raw_name === "" ? "vocabug.txt" : `${raw_name}.txt`;

        link.download = download_name;
        link.click();
        URL.revokeObjectURL(link.href);

        // Save input text in user's local storage for the next session
        localStorage.setItem("vocabug", JSON.stringify([file_content, raw_name]));
    });

    // Examples buttons
    document.querySelectorAll(".voc-example").forEach((button) => {
        button.addEventListener("click", () => {
            const choice:string = (button as HTMLElement).getAttribute("value") || '?';
            const text = examples[choice];
            const confirmed = window.confirm("Replace editor text with example?");
            
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
});

function clear_results(): void {
    (document.getElementById('prog-output-message') as HTMLDivElement).innerHTML = "<p class='grey-message'>Information may be shown here...</p>";
    (document.getElementById('voc-output-words-field') as HTMLInputElement).value = "";
}

function set_filename(filename: string): void {
    (document.getElementById('file-name') as HTMLInputElement).value = filename;
}

function mode_buttons() {
    // Mode buttons
    const selectElement = document.getElementById("my_mode") as HTMLSelectElement;
    const sort_words = document.getElementById("sort-words") as HTMLInputElement;
    const remove_duplicates = document.getElementById("remove-duplicates") as HTMLInputElement;
    const word_divider = document.getElementById("word-divider") as HTMLInputElement;
    const force_words = document.getElementById("force-words") as HTMLInputElement;

    const selectedValue = selectElement.value;
    switch (selectedValue) {
        case "word-list":
            if (sort_words) sort_words.disabled = false;
            if (remove_duplicates) remove_duplicates.disabled = false;
            if (word_divider) word_divider.disabled = false;
            if (force_words) force_words.disabled = false;
            break;
        default:
            if (sort_words) sort_words.disabled = true;
            if (remove_duplicates) remove_duplicates.disabled = true;
            if (word_divider) word_divider.disabled = true;
            if (force_words) force_words.disabled = true;
            break;
    }

}



function colourSchemeButtons(clickedElement: HTMLElement): void {
    const selection: NodeListOf<HTMLAnchorElement> = document.querySelectorAll("#colour-switch-field a");
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