import Resolver from './resolver.ts';
import Word_Builder from './word_builder.ts';
import Transformer from './transformer.ts';
import Text_Builder from './text_builder.ts';
import Logger from './logger';
import Escape_Mapper from './escape_mapper'; 
import SupraBuilder from './supra_builder';

function gen_words(
    file: string, num_of_words: string,
    mode: string = 'word-list', remove_duplicates: boolean = true, force_word_limit: boolean = false,
    sort_words: boolean = true, capitalise_words: boolean = false, word_divider: string = " "
): { text:string, errors:string[], warnings:string[], infos:string[] } {
    const build_start = Date.now();
    const logger = new Logger();
    let text:string = ''

    try {
        const escape_mapper = new Escape_Mapper();
        const supra_builder = new SupraBuilder();

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
        r.create_record();

        const wordBuilder = new Word_Builder(
            escape_mapper, r.supra_builder, r.categories, r.wordshapes,
            r.category_distribution, r.optionals_weight, r.debug
        );

        const transformer = new Transformer(
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
        logger.error(typeof e === "string" ? e : e instanceof Error ? e.message : String(e));
    }

    return { text:text, errors:logger.errors, warnings:logger.warnings, infos:logger.infos };
}

export default gen_words;