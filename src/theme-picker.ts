window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event: MediaQueryListEvent): void => {
    if (!localStorage.hasOwnProperty('colourScheme')) {
        const scheme: string = event.matches ? "dark" : "light";
        const colour_target = document.getElementById("colour-target");

        if (!colour_target) return;

        if (scheme === "dark") {
            colour_target.classList.remove("light-mode");
        } else if (scheme === "light") {
            colour_target.classList.add("light-mode");
        }
    }
});