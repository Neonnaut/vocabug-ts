import Resolver from './resolver';
import Word_Builder from './word_builder';
import Transformer from './transformer';
import Text_Builder from './text_builder';
import Logger from './logger';
import Escape_Mapper from './escape_mapper'; 
import SupraBuilder from './supra_builder';

type generate_options = {
  file: string;
  num_of_words?: number | string;
  mode?: string;
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
        //let y = "yab"
        //y = y.join("cab")

        const escape_mapper = new Escape_Mapper();
        const supra_builder = new SupraBuilder(logger);

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
        r.resolve_transforms();
        r.create_record();

        const wordBuilder = new Word_Builder( logger,
            escape_mapper, r.supra_builder, r.categories, r.wordshapes,
            r.category_distribution, r.optionals_weight, r.debug
        );

        const transformer = new Transformer( logger,
            r.graphemes, r.transforms
        );

        const textBuilder = new Text_Builder(
            logger, build_start, r.num_of_words, r.paragrapha,
            r.remove_duplicates, r.force_word_limit, r.sort_words,
            r.capitalise_words, r.word_divider, r.alphabet, r.invisible
        );

        // Yo! this is where we generate da words !!
        // Wow. Such words
        while (!textBuilder.terminated) {
            let word = wordBuilder.make_word();
            word = transformer.do_transforms(word);
            textBuilder.add_word(word);
        }
        text = textBuilder.make_text();
        
    } catch (e: unknown) {
        if (!(e instanceof logger.ValidationError)) {
            logger.uncaught_error(e as Error);
        }
    }

    return { text:text, errors:logger.errors, warnings:logger.warnings,
        infos:logger.infos, diagnostics:logger.diagnostics };
}

export default generate;