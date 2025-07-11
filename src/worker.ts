import gen_words from '../src/modules/core';

onmessage = function (event) {
    const vocabug = gen_words(
        event.data.file,
        event.data.num_of_words,

        event.data.mode,
        event.data.remove_duplicates,
        event.data.force_word_limit,

        event.data.sort_words,
        event.data.capitalise_words,
        event.data.word_divider
    );

    postMessage({
        words: vocabug.text,
        file: event.data.file,
        
        error_message: vocabug.errors,
        warning_message: vocabug.warnings,
        info_message: vocabug.infos
    });
}

