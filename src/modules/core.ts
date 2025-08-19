import Resolver from './resolver';
import Word_Builder from './word_builder';
import Transformer from './transformer';
import Text_Builder from './text_builder';
import Logger from './logger';
import Escape_Mapper from './escape_mapper'; 
import Supra_Builder from './supra_builder';
import Transform_Resolver from './transform_resolver';
import Nesca_Grammar_Stream from './nesca_grammar_stream';
import type { Generation_Mode } from './types'

type generate_options = {
  file: string;
  num_of_words?: number | string;
  mode?: Generation_Mode;
  remove_duplicates?: boolean;
  force_word_limit?: boolean;
  sort_words?: boolean;
  capitalise_words?: boolean;
  word_divider?: string;
};

function generate({
    file,
    num_of_words = 100,
    mode = 'word-list',
    remove_duplicates = true,
    force_word_limit = false,
    sort_words = true,
    capitalise_words = false,
    word_divider = ' '
}: generate_options): {
    text: string;
    errors: string[];
    warnings: string[];
    infos: string[];
    diagnostics: string[];
} {
    const logger = new Logger();
    let text:string = ''

    try {
        const build_start = Date.now();

        const escape_mapper = new Escape_Mapper();
        const supra_builder = new Supra_Builder(logger);

        const r = new Resolver(
            logger, escape_mapper, supra_builder,
            num_of_words, mode, sort_words, capitalise_words,
            remove_duplicates, force_word_limit, word_divider
        );

        r.parse_file(file);
        r.expand_categories();
        r.expand_segments();
        r.expand_wordshape_segments();
        r.set_wordshapes();

        const s = new Nesca_Grammar_Stream(
            logger, r.graphemes, escape_mapper
        );

        const z = new Transform_Resolver(
            logger, s, r.categories, r.transform_pending
        )

        r.set_transforms(z.resolve_transforms());

        if(r.debug) { r.create_record(); }

        const word_builder = new Word_Builder(
            escape_mapper, r.supra_builder, r.categories, r.wordshapes,
            r.category_distribution, r.optionals_weight, r.debug
        );

        const transformer = new Transformer( logger,
            r.graphemes, r.transforms, r.debug
        );

        const text_builder = new Text_Builder(
            logger, build_start, r.num_of_words, r.paragrapha,
            r.remove_duplicates, r.force_word_limit, r.sort_words,
            r.capitalise_words, r.word_divider, r.alphabet, r.invisible
        );

        // Yo! this is where we generate da words !!
        // Wow. Such words
        while (!text_builder.terminated) {
            let word = word_builder.make_word();
            word = transformer.do_transforms(word);
            text_builder.add_word(word);
        }
        text = text_builder.make_text();
        
    } catch (e: unknown) {
        if (!(e instanceof logger.Validation_Error)) {
            logger.uncaught_error(e as Error);
        }
    }

    return { text:text, errors:logger.errors, warnings:logger.warnings,
        infos:logger.infos, diagnostics:logger.diagnostics };
}

export default generate;