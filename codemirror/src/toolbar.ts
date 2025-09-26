import { EditorView, showPanel } from '@codemirror/view';

function toolbar_func(view: EditorView) {
    const dom = document.createElement("div");
    dom.className = "cm-toolbar";

    const num_label = document.createElement("label");
    num_label.textContent = "Nº of Words:";
    num_label.htmlFor = "num-of-words";
    dom.appendChild(num_label);

    const num_words_textbox = document.createElement("input");
    num_words_textbox.type = "number";
    num_words_textbox.min = "1";
    num_words_textbox.max = "9999";
    num_words_textbox.placeholder = "100";
    num_words_textbox.autocomplete = "off";
    num_words_textbox.id = "num-of-words";
    num_words_textbox.onclick = () => {
    };
    dom.appendChild(num_words_textbox);

    const generate_btn = document.createElement("button");
    generate_btn.textContent = "Generate";
    generate_btn.id = "generate-words";
    generate_btn.onclick = () => {
    };
    dom.appendChild(generate_btn);

    const config_btn = document.createElement("button");
    config_btn.innerHTML = "<i class='fa fa-gear'></i>";
    config_btn.onclick = () => {
        window.location.href = '#config';
    };
    dom.appendChild(config_btn);

    const open_btn = document.createElement("button");
    open_btn.innerHTML = "<i class='fa fa-folder'></i>";
    open_btn.onclick = () => {
        window.location.href = '#file-save-load';
    };
    dom.appendChild(open_btn);

    const clear_btn = document.createElement("button");
    clear_btn.innerHTML = "<i class='fa fa-trash'></i>";
    clear_btn.id = "clear-editor"
    dom.appendChild(clear_btn);

    const help_btn = document.createElement("button");
    help_btn.innerHTML = "<i class='fa fa-question'></i>";
    help_btn.onclick = () => {
        // Open help page in new tab
        window.open("./vocabug_docs", "_blank");
    };
    dom.appendChild(help_btn);

    return {
        dom,
        top: false
    };
}
const toolbar = showPanel.of(toolbar_func);

export { toolbar };