import { nesca } from '../../src/main';

onmessage = function (event) {
    const log = nesca({
        file: event.data.file,
        input_words: event.data.input_words,
        
        output_mode: event.data.mode,
        input_divider: event.data.input_divider,
        output_divider: event.data.output_divider,
        sort_words: event.data.sort_words
    });

    postMessage({
        words: log.payload,
        file: event.data.file,
        input_words: event.data.input_words,

        error_messages: log.errors,
        warning_messages: log.warnings,
        info_messages: log.infos,
        diagnostic_messages: log.diagnostics
    });
}

