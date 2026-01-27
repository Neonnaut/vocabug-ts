import { vocabug_f } from '../../src/main';

onmessage = function (event) {
    const log = vocabug_f({
        file: event.data.file,
        num_of_words: event.data.num_of_words,

        output_mode: event.data.output_mode,
        remove_duplicates: event.data.remove_duplicates,
        force_word_limit: event.data.force_word_limit,

        sort_words: event.data.sort_words,
        output_divider: event.data.output_divider
    });

    postMessage({
        file: event.data.file,   
        payload: log.payload,
        error_messages: log.errors,
        warning_messages: log.warnings,
        info_messages: log.infos,
        diagnostic_messages: log.diagnostics
    });
}

