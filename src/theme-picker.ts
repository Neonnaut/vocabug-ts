window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event: MediaQueryListEvent): void => {
    if (!localStorage.hasOwnProperty('colourScheme')) {
        const scheme: string = event.matches ? "dark" : "light";
        const colourTarget = document.getElementById("colour-target");

        if (!colourTarget) return;

        if (scheme === "dark") {
            colourTarget.classList.remove("light-mode");
        } else if (scheme === "light") {
            colourTarget.classList.add("light-mode");
        }
    }
});