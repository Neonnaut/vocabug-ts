import type Escape_Mapper from '../escape_mapper';
import Logger from '../logger';

import { recursive_expansion } from '../utilities';
import type { Output_Mode } from '../types';

class Resolver {
    private logger: Logger;
    private escape_mapper: Escape_Mapper;
    private output_mode: Output_Mode;

    public feature_pending: Map<string, { content:string, line_num:number }>;
    public features: Map<string, { graphemes:string[] }>;
    
    public graphemes: string[];

    constructor(
        logger: Logger,  output_mode: Output_Mode,
        escape_mapper: Escape_Mapper,
        feature_pending: Map<string, { content:string, line_num:number }>,
        graphemes: string[],

    ) {
        this.logger = logger; this.output_mode = output_mode;
        this.escape_mapper = escape_mapper;

        this.graphemes = graphemes;
        this.feature_pending = feature_pending;

        this.features = new Map;

        this.resolve_features();
        if (this.output_mode === 'debug'){ this.show_debug(); }
    }

    resolve_features() {
        // Resolve parafeatures
        for (const [key, value] of this.feature_pending) {
            if (key.startsWith('>')) {
                this.feature_pending.delete(key);
                const to_delete = value.content.split(",").map(str => "^" + str);
                const anti_graphemes = to_delete.join(",")+this.graphemes.join(",");

                this.feature_pending.set(key.replace(">", "-"), {
                    content: anti_graphemes, line_num: value.line_num }
                );
                this.feature_pending.set(key.replace(">", "+"), {
                    content: value.content, line_num: value.line_num }
                );
            }
        }

        for (const [key, value] of this.feature_pending) {
            const expanded_content = recursive_expansion(value.content, this.feature_pending);
            this.feature_pending.set(key, {
                content: expanded_content,
                line_num: value.line_num, // Preserve original line_num
            });
        }

        for (const [key, value] of this.feature_pending) {
            const unique_graphemes = Array.from(new Set(value.content.split(",")));
            
            const filtered_graphemes: string[] = [];
            const graphemes_to_remove: string[] = [];

            for (const item of unique_graphemes) {
                if (item.startsWith('^') || item.startsWith('∅')) {
                    const modified = item.slice(1);
                    graphemes_to_remove.push(modified);
                    continue;
                }
                if (item.includes('^')) {
                    this.logger.validation_error(`Invalid grapheme '${item}' has a misplaced caret`, value.line_num);
                }
                if (item.includes('∅')) {
                    this.logger.validation_error(`Invalid grapheme '${item}' has a misplaced null character`, value.line_num);
                }
                if (item.startsWith('+') || item.startsWith('-') || item.startsWith('>')) {
                    this.logger.validation_error(`Referenced feature '${item}' not found`, value.line_num);
                }
                filtered_graphemes.push(item);
            }

            const x_filtered = filtered_graphemes.filter(item => !graphemes_to_remove.includes(item));

            if (x_filtered.length === 0) {
                this.logger.validation_error(`Feature '${key}' had zero graphemes`, value.line_num);
            }

            // Escape special chars in graphemes
            for (let i = 0; i < x_filtered.length; i++) {
                x_filtered[i] = this.escape_mapper.escape_special_chars(x_filtered[i]);
            }

            this.features.set(key, { graphemes:x_filtered });
        }
    }

    show_debug(): void {
        let features = [];
        for (const [key, value] of this.features) {
            features.push(`  ${key} = ${value.graphemes.join(', ')}`);
        }

        let info:string =
            `~ FEATURES ~\n` +
            `\nFeatures {\n` + features.join('\n') + `\n}`

        this.logger.diagnostic(info);
    }
}

export default Resolver;