import { Compartment, EditorState } from '@codemirror/state';
import { highlightSelectionMatches } from '@codemirror/search';
import { indentWithTab, defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { indentUnit, bracketMatching, LanguageSupport} from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { EditorView, keymap, lineNumbers,
    highlightActiveLineGutter, drawSelection, highlightActiveLine } from '@codemirror/view';

// Themes
import { xcodeLight, xcodeDark } from '../dark-light';
const themeConfig = new Compartment();
const lineWrapConfig = new Compartment();

// Language
import { vocabugStream } from '../vocabug-lang/index';

function createEditorState(initialContents:string, myTheme:string) {
    let extensions = [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        indentUnit.of("  "),
        EditorState.allowMultipleSelections.of(true),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
            indentWithTab,
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
        ]),
        new LanguageSupport(vocabugStream),
        themeConfig.of(themeIdentifier(myTheme)),
        lineWrapConfig.of([])
    ];

    return EditorState.create({
        doc: initialContents,
        extensions
    });
}

function createEditorView(state:EditorState, parent:HTMLElement) {
    return new EditorView({ state, parent });
}

function themeIdentifier(myTheme:string) {
    switch (myTheme) {
        case 'light': return xcodeLight;
        case 'dark': return xcodeDark;
        default: return xcodeLight;
    }
}

function changeEditorTheme(myEditor:EditorView, myTheme:string) {
    myEditor.dispatch({
        effects: themeConfig.reconfigure(themeIdentifier(myTheme))
    })
}

function changeEditorLineWrap(myEditor:EditorView, wrapping:boolean) {
    myEditor.dispatch({
        effects: [lineWrapConfig.reconfigure(
            wrapping ? EditorView.lineWrapping : []
        )]
    })
}

export { createEditorState, createEditorView, changeEditorTheme, changeEditorLineWrap };