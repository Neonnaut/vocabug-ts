set -e

# run a linter pass
echo 'Linting...'
yarn -s lint --fix

echo 'Combining files...'
# put the version number and license comment here, so it ends up in all dist/
# files
version=$(grep version package.json | cut -d '"' -f 4)
# the use of `/*!` ensures compilation preserves it
license_comment=$(printf '/*! Vocabug' "$version" "$(cat LICENSE)")
{
    echo "$license_comment"
    # index.ts needs to go last; the others, order doesn't matter
    for filename in src/*.ts
    do
        [ "$filename" != 'src/index.ts' ] &&
            sed '/import/d;/export/d' "$filename"
    done
    sed '/import/d;/export/d' src/index.ts
    echo 'export = main;'
} > index.ts

echo 'Compiling to JS...'
npx tsc

# Run `tsc` in the bin/ directory
cd bin/
npx tsc
cd ../

echo 'Minifying...'
sed '$d' dist/index.js | npx terser -m reserved='[genWords]' --ecma 2022 \
    --toplevel -c unsafe,unsafe_symbols,top_retain='genWords' \
    -o dist/lexifer.min.js -f wrap_func_args=false
npx terser bin/index.js -mc unsafe --ecma 2022 --toplevel -o bin/lexifer \
    -f wrap_func_args=false,semicolons=false,preamble="'$(printf \
    '#! /usr/bin/env node\n%s' "$license_comment" | awk '{printf "%s\\n", $0}')'"

echo 'Testing...'
yarn -s test
echo 'Done.'