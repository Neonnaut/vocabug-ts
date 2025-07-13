import gen_words from '../src/modules/core';

onmessage = function (event) {
    const vocabug = gen_words({
        file: event.data.file,
        num_of_words: event.data.num_of_words,

        mode: event.data.mode,
        remove_duplicates: event.data.remove_duplicates,
        force_word_limit: event.data.force_word_limit,

        sort_words: event.data.sort_words,
        capitalise_words: event.data.capitalise_words,
        word_divider: event.data.word_divider
    });

    postMessage({
        words: vocabug.text,
        file: event.data.file,
        
        error_messages: vocabug.errors,
        warning_messages: vocabug.warnings,
        info_messages: vocabug.infos,
        diagnostic_messages: vocabug.diagnostics
    });
}

