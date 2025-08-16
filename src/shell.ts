// @ts-ignore
import MyWorker from './worker?worker';

import { examples } from './examples.ts';

const cm6 = (window as any).cm6; // This was global. Stops TS from complaining

const w = new MyWorker();

function create_file_editor() {
    // Work out content and theme of file editor
    let content = ''; let theme = 'dark'; let filename = '';
    if (localStorage.hasOwnProperty('vocabug')) {
        try {
            const got_LocalStorage = JSON.parse(localStorage.getItem('vocabug') || '[]') as [string, string];
            content = got_LocalStorage[0]; filename = got_LocalStorage[1];
        } catch {
            localStorage.removeItem("vocabug");
            content = examples.basic;
        }
    } else {
        content = examples.basic;
    }
    if (localStorage.hasOwnProperty('colourScheme')) {
        if (localStorage.getItem('colourScheme') != 'dark-mode') {
            theme = 'light'
        }
    }

    if (filename) {
        set_filename(filename);
    }

    // Create file editor
    return cm6.createEditorView(
        cm6.createEditorState(content, theme),
        document.getElementById("editor")
    );
}

window.addEventListener("load", () => {
    const editor = create_file_editor();

    editor.dispatch({
        selection: { anchor: editor.state.doc.length }
    })

    // Watch for dark / light change in system settings for system theme people
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (!localStorage.hasOwnProperty('colourScheme')) {
            let scheme = event.matches ? "dark" : "light";
            if (scheme == "dark") {
                cm6.changeEditorTheme(editor, "dark");
            } else if (scheme == "light") {
                cm6.changeEditorTheme(editor, "light");
            }
        }
    });

    // Generate button
    document.getElementById("generate-words")?.addEventListener("click", function () {
        const generate_button = this as HTMLButtonElement;
        const output_message = document.getElementById('voc-output-message') as HTMLDivElement;
        generate_button.disabled = true;

        try {
            w.postMessage({
                file: editor.state.doc.toString(),
                num_of_words: (document.getElementById('num-of-words') as HTMLInputElement)?.value || "",
                
                mode: (document.querySelector('input[name="mode-type"]:checked') as HTMLInputElement)?.value || "",
                remove_duplicates: (document.getElementById('remove-duplicates') as HTMLInputElement)?.checked || false,
                force_word_limit: (document.getElementById('force-words') as HTMLInputElement)?.checked || false,
                
                sort_words: (document.getElementById('sort-words') as HTMLInputElement)?.checked || false,
                capitalise_words: (document.getElementById('capitalise-words') as HTMLInputElement)?.checked || false,
                word_divider: (document.getElementById('word-divider') as HTMLInputElement)?.value || ""
            });
            w.onerror = function (e: ErrorEvent) {
                generate_button.disabled = false;
                output_message.innerHTML = `<p class='error-message'>${e.message}</p>`;
            };

        } catch (e) {
            generate_button.disabled = false;
            const error_message = e instanceof Error ? e.message : String(e);
            output_message.innerHTML = `<p class='error-message'>${error_message}</p>`;
        }
    });

    // After generating words 
    w.onmessage = (e: MessageEvent) => {
        const output_words_field = document.getElementById('voc-output-words-field') as HTMLInputElement;
        const output_message = document.getElementById('voc-output-message') as HTMLDivElement;
        const filename_input = document.getElementById('file-name') as HTMLInputElement;
        const generate_words_button = document.getElementById("generate-words") as HTMLButtonElement;

        if (output_words_field) {
            // Transfer words to the output
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
        output_message.innerHTML = output_message_html;

        // Store file contents in local storage to be retrieved on page refresh
        localStorage.setItem('vocabug', JSON.stringify([e.data.file, filename]));

        if (generate_words_button) {
            generate_words_button.disabled = false;
        }
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
    const clear_button = document.getElementById("voc-clear-editor") as HTMLButtonElement | null;
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

    // Mode buttons
    document.querySelectorAll("input[name='mode-type']").forEach((element) => {
        element.addEventListener("click", () => {
            const word_list_mode = document.getElementById("word-list-mode") as HTMLInputElement;
            const sort_words = document.getElementById("sort-words") as HTMLInputElement;
            const capitalise_words = document.getElementById("capitalise-words") as HTMLInputElement;
            const remove_duplicates = document.getElementById("remove-duplicates") as HTMLInputElement;
            const word_divider = document.getElementById("word-divider") as HTMLInputElement;
            const force_words = document.getElementById("force-words") as HTMLInputElement;

            if (word_list_mode?.checked) {
                if (sort_words) sort_words.disabled = false;
                if (capitalise_words) capitalise_words.disabled = false;
                if (remove_duplicates) remove_duplicates.disabled = false;
                if (word_divider) word_divider.disabled = false;
                if (force_words) force_words.disabled = false;
            } else {
                [sort_words, capitalise_words, remove_duplicates, word_divider, force_words].forEach(element => {
                    if (element) element.disabled = true;
                });
            }
        });
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
    document.getElementById("show-keyboard")?.addEventListener("click", () => {
        const keyboard_table = document.getElementById("voc-keyboard-table") as HTMLDivElement;
        const checkbox = document.getElementById('show-keyboard') as HTMLInputElement;
        
        if (keyboard_table && checkbox) {
            keyboard_table.style.display = checkbox.checked ? "block" : "none";
        }
    });

    // IPA buttons
    document.querySelectorAll(".ipa-button").forEach((button) => {
        button.addEventListener("mousedown", (e) => {
            e.preventDefault();
            editor.dispatch({
                changes: {
                    from: editor.state.selection.main.head,
                    insert: button.getAttribute("value")
                },
                selection: { anchor: editor.state.selection.main.head + 1 },
                scrollIntoView: true,
            })
        });
    });
});

function clear_results(): void {
    (document.getElementById('voc-output-message') as HTMLInputElement).innerHTML = "";
    (document.getElementById('voc-output-words-field') as HTMLInputElement).value = "";
}

function set_filename(filename: string): void {
    (document.getElementById('file-name') as HTMLInputElement).value = filename;
}