import Resolver from './resolver.ts';
import Word_Builder from './word_builder.ts';
import Transformer from './transformer.ts';
import Text_Builder from './text_builder.ts';
import Logger from './logger.ts';
import Escape_Mapper from './escape_mapper.ts'; 
import InterBuilder from './inter_builder.ts';

function gen_words(
    file: string,
    num_of_words: string,
    mode: string = 'word-list',
    sort_words: boolean = true,
    capitalise_words: boolean = false,
    remove_duplicates: boolean = true,
    force_word_limit: boolean = false,
    word_divider: string = " "
): { text:string, errors:string[], warnings:string[], infos:string[] } {
    const build_start = Date.now();
    const logger = new Logger();
    let text = '';

    try {
        const escape_mapper = new Escape_Mapper(); // Initialize Escape_Mapper to ensure it's ready for use

        const resolver = new Resolver(
            logger,
            escape_mapper,
            num_of_words,
            mode,
            sort_words,
            capitalise_words,
            remove_duplicates,
            force_word_limit,
            word_divider
        );

        const inter_builder = new InterBuilder(logger);



        resolver.parse_file(file);
        resolver.expand_categories();
        resolver.expand_segments();
        resolver.expand_wordshape_segments();
        resolver.set_wordshapes(inter_builder);
        resolver.create_record();

        const wordBuilder = new Word_Builder(
            logger,
            escape_mapper,
            inter_builder,
            resolver.categories,
            resolver.wordshapes,
            resolver.wordshape_distribution,
            resolver.optionals_weight,
            resolver.debug
        );

        const transformer = new Transformer(
            logger,
            resolver.graphemes,
            resolver.transforms
        );

        const textBuilder = new Text_Builder(
            logger,
            build_start,
            escape_mapper,
            resolver.num_of_words,
            resolver.debug,
            resolver.paragrapha,
            resolver.remove_duplicates,
            resolver.force_word_limit,
            resolver.sort_words,
            resolver.capitalise_words,
            resolver.word_divider,
            resolver.alphabet,
            resolver.invisible
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

// module.exports = gen_words;