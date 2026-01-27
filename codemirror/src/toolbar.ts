import { showPanel } from '@codemirror/view';

function toolbar_func(app) {
    const dom = document.createElement("div");
    dom.className = "cm-toolbar";

    const generate_btn = document.createElement("button");
    generate_btn.textContent = app === "vocabug" ? "Generate" : "Apply";
    generate_btn.classList.add("action-btn", "green-btn");
    dom.appendChild(generate_btn);

    const clear_btn = document.createElement("button");
    clear_btn.innerHTML = "<i class='fa fa-trash-can'></i>";
    clear_btn.id = "clear-editor";
    dom.appendChild(clear_btn);

    const config_btn = document.createElement("button");
    config_btn.innerHTML = "<i class='fa fa-gear'></i>";
    config_btn.onclick = () => window.location.href = '#config';
    dom.appendChild(config_btn);

    const open_btn = document.createElement("button");
    open_btn.innerHTML = "<i class='fa fa-folder'></i>";
    open_btn.onclick = () => window.location.href = '#file-save-load';
    dom.appendChild(open_btn);

    return { dom, top: false };
}

export function toolbar(app:string) {
    return showPanel.of(() => toolbar_func(app));
}
