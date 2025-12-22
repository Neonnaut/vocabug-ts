import Parser from "./parser";
import Word_Builder from "./generata/word_builder";
import Transformer from "./transforma/transformer";
import Text_Builder from "./text_builder";
import Logger from "./logger";
import Escape_Mapper from "./escape_mapper";
import Supra_Builder from "./generata/supra_builder";
import Transform_Resolver from "./resolvers/transform_resolver";
import Nesca_Grammar_Stream from "./resolvers/nesca_grammar_stream";
import type { Output_Mode } from "./utils/types";

import CategoryResolver from "./resolvers/category_resolver";
import GenerationResolver from "./resolvers/generation_resolver";
import FeatureResolver from "./resolvers/feature_resolver";
import CanonGraphemesResolver from "./resolvers/canon_graphemes_resolver";
import { VOCABUG_VERSION } from "./utils/vocabug-version";

type generate_options = {
   file: string;
   num_of_words?: number | string;
   mode?: Output_Mode;
   remove_duplicates?: boolean;
   force_word_limit?: boolean;
   sort_words?: boolean;
   word_divider?: string;
};

function make_introduction() {
   return `Generating words with Vocabug version ${VOCABUG_VERSION}. This may take up to 30 seconds...`;
}

function generate({
   file,
   num_of_words = 100,
   mode = "word-list",
   remove_duplicates = true,
   force_word_limit = false,
   sort_words = true,
   word_divider = " ",
}: generate_options): {
   text: string;
   errors: string[];
   warnings: string[];
   infos: string[];
   diagnostics: string[];
} {
   const logger = new Logger();
   let text: string = "";

   try {
      const build_start = Date.now();

      const escape_mapper = new Escape_Mapper();
      const supra_builder = new Supra_Builder(logger);

      const p = new Parser(
         logger,
         escape_mapper,
         supra_builder,
         num_of_words,
         mode,
         sort_words,
         remove_duplicates,
         force_word_limit,
         word_divider,
      );
      p.parse_file(file);

      const category_resolver = new CategoryResolver(
         logger,
         p.output_mode,
         escape_mapper,
         p.category_distribution,
         p.category_pending,
      );

      const generation_resolver = new GenerationResolver(
         logger,
         p.output_mode,
         supra_builder,
         p.wordshape_distribution,
         p.units,
         p.wordshape_pending,
         p.optionals_weight,
      );

      const canon_graphemes_resolver = new CanonGraphemesResolver(
         logger,
         escape_mapper,
         p.graphemes_pending,
      );

      const feature_resolver = new FeatureResolver(
         logger,
         p.output_mode,
         escape_mapper,
         p.feature_pending,
         canon_graphemes_resolver.graphemes,
      );

      const nesca_grammar_stream = new Nesca_Grammar_Stream(
         logger,
         canon_graphemes_resolver.graphemes,
         canon_graphemes_resolver.associateme_mapper,
         escape_mapper,
      );

      const transform_resolver = new Transform_Resolver(
         logger,
         p.output_mode,
         nesca_grammar_stream,
         category_resolver.trans_categories,
         p.transform_pending,
         feature_resolver.features,
         p.syllable_boundaries,
      );

      // Phew! done resolving things

      const word_builder = new Word_Builder(
         escape_mapper,
         supra_builder,
         category_resolver.categories,
         generation_resolver.wordshapes,
         category_resolver.category_distribution,
         generation_resolver.optionals_weight,
         p.output_mode,
      );

      const transformer = new Transformer(
         logger,
         canon_graphemes_resolver.graphemes,
         transform_resolver.syllable_boundaries,
         transform_resolver.transforms,
         p.output_mode,
         canon_graphemes_resolver.associateme_mapper,
      );

      const text_builder = new Text_Builder(
         logger,
         build_start,
         p.num_of_words,
         p.output_mode,
         p.remove_duplicates,
         p.force_word_limit,
         p.sort_words,
         p.word_divider,
         p.alphabet,
         p.invisible,
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

   return {
      text: text,
      errors: logger.errors,
      warnings: logger.warnings,
      infos: logger.infos,
      diagnostics: logger.diagnostics,
   };
}

export { generate, make_introduction };
