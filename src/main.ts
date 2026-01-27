import Parser from "./parser";
import Word_Builder from "./generata/word_builder";
import Transformer from "./transforma/transformer";
import Text_Builder from "./text_builder";
import Logger from "./logger";
import Escape_Mapper from "./escape_mapper";
import Lettercase_Mapper from "./transforma/lettercase_mapper";
import Supra_Builder from "./generata/supra_builder";
import Transform_Resolver from "./resolvers/transform_resolver";
import Nesca_Grammar_Stream from "./resolvers/nesca_grammar_stream";
import type { Output_Mode } from "./utils/types";

import Category_Resolver from "./resolvers/category_resolver";
import Trans_Category_Resolver from "./resolvers/trans_category_resolver";
import Generation_Resolver from "./resolvers/generation_resolver";
import Feature_Resolver from "./resolvers/feature_resolver";
import Canon_Graphemes_Resolver from "./resolvers/canon_graphemes_resolver";

import Word_Bank from "./word_bank";

import type { App, Log } from "./utils/types";

type Vocabug_Options = {
   file: string;
   num_of_words?: number | string;
   output_mode?: Output_Mode;
   remove_duplicates?: boolean;
   force_word_limit?: boolean;
   sort_words?: boolean;
   output_divider?: string;
};
type Nesca_Options = {
   file: string;
   input_words: string;
   output_mode?: Output_Mode;
   sort_words?: boolean;
   input_divider?: string;
   output_divider?: string;
};

export function vocabug({
   file,
   num_of_words = 100,
   output_mode = "word-list",
   remove_duplicates = true,
   force_word_limit = false,
   sort_words = true,
   output_divider = " ",
}: Vocabug_Options): Log {
   const logger = new Logger();
   const app = "vocabug" as App;

   try {
      const build_start = Date.now();

      const escape_mapper = new Escape_Mapper();
      const supra_builder = new Supra_Builder(logger);

      const lettercase_mapper = new Lettercase_Mapper();

      const p = new Parser(
         logger,
         app,
         escape_mapper,
         lettercase_mapper,
         num_of_words,
         output_mode,
         sort_words,
         remove_duplicates,
         force_word_limit,
         " ",
         output_divider,
      );
      p.parse_file(file);

      const category_resolver = new Category_Resolver(
         logger,
         p.output_mode,
         escape_mapper,
         p.category_distribution,
         p.category_pending,
      );

      const generation_resolver = new Generation_Resolver(
         logger,
         p.output_mode,
         supra_builder,
         p.wordshape_distribution,
         p.units,
         p.wordshape_pending,
         p.optionals_weight,
      );

      const canon_graphemes_resolver = new Canon_Graphemes_Resolver(
         logger,
         escape_mapper,
         p.graphemes_pending,
      );

      const feature_resolver = new Feature_Resolver(
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
         p.stages_pending,
         p.substages_pending,
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
         p.lettercase_mapper,
         transform_resolver.syllable_boundaries,
         transform_resolver.stages,
         transform_resolver.substages,
         p.output_mode,
         canon_graphemes_resolver.associateme_mapper,
      );

      const text_builder = new Text_Builder(
         logger,
         p.lettercase_mapper,
         build_start,

         p.num_of_words,
         p.remove_duplicates,
         p.force_word_limit,

         p.output_mode,
         p.output_divider,

         p.sort_words,
         p.alphabet,
         p.invisible,
      );

      // Yo! this is where we generate da words !!
      // Wow. Such words
      while (!text_builder.terminated) {
         let word = word_builder.make_word();
         word = transformer.do_stages(word);
         text_builder.add_word(word);
      }
      logger.set_payload(text_builder.make_text());
   } catch (e: unknown) {
      if (!(e instanceof logger.Validation_Error)) {
         logger.uncaught_error(e as Error);
      }
   }
   return logger.create_log();
}

export function nesca({
   file,
   input_words,
   output_mode = "word-list",
   input_divider = "\n",
   output_divider = "\n",
   sort_words = true,
}: Nesca_Options): Log {
   const logger = new Logger();

   try {
      const build_start = Date.now();

      const escape_mapper = new Escape_Mapper();
      const lettercase_mapper = new Lettercase_Mapper();

      const p = new Parser(
         logger,
         "nesca" as App,
         escape_mapper,
         lettercase_mapper,
         1, //numwords
         output_mode,
         sort_words,
         false, // remove duplicates
         false, // force word limit
         input_divider,
         output_divider,
      );
      p.parse_file(file);

      const category_resolver = new Trans_Category_Resolver(
         logger,
         p.output_mode,
         p.category_pending,
      );

      const canon_graphemes_resolver = new Canon_Graphemes_Resolver(
         logger,
         escape_mapper,
         p.graphemes_pending,
      );

      const feature_resolver = new Feature_Resolver(
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

      // Get the macros

      const transform_resolver = new Transform_Resolver(
         logger,
         p.output_mode,
         nesca_grammar_stream,
         category_resolver.trans_categories,
         p.stages_pending,
         p.substages_pending,
         feature_resolver.features,
         p.syllable_boundaries,
      );

      // Phew! done resolving things

      const transformer = new Transformer(
         logger,
         canon_graphemes_resolver.graphemes,
         p.lettercase_mapper,
         transform_resolver.syllable_boundaries,
         transform_resolver.stages,
         transform_resolver.substages,
         p.output_mode,
         canon_graphemes_resolver.associateme_mapper,
      );

      const b = new Word_Bank(
         logger,
         p.lettercase_mapper,
         build_start,

         input_words,
         p.input_divider,

         p.output_mode,
         p.output_divider,

         p.sort_words,
         p.alphabet,
         p.invisible,
      );

      // Yo! this is where we change da words !!
      // Wow. Such change
      for (let i = 0; i < b.words.length; i++) {
         b.words[i] = transformer.do_stages(b.words[i]);
      }
      logger.set_payload(b.make_text());
   } catch (e: unknown) {
      if (!(e instanceof logger.Validation_Error)) {
         logger.uncaught_error(e as Error);
      }
   }

   return logger.create_log();
}
