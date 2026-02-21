import { LanguageDescription, LanguageSupport, StreamLanguage, type StreamParser } from '@codemirror/language';

const solidityKeywords = new Set([
  'pragma',
  'contract',
  'function',
  'mapping',
  'modifier',
  'event',
  'emit',
  'require',
  'payable',
  'view',
  'pure',
  'external',
  'internal',
  'public',
  'private',
]);

const solidityTypes = new Set(['uint256', 'address', 'bool', 'string', 'bytes']);

function isSolidityIntegerType(word: string) {
  return /^u?int(?:8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/.test(
    word,
  );
}

function isSolidityBytesType(word: string) {
  return /^bytes(?:[1-9]|[12]\d|3[0-2])?$/.test(word);
}

type SolidityState = {
  inBlockComment: boolean;
  stringDelimiter: '"' | "'" | null;
};

const solidityParser: StreamParser<SolidityState> = {
  startState() {
    return {
      inBlockComment: false,
      stringDelimiter: null,
    };
  },
  token(stream, state) {
    if (state.inBlockComment) {
      if (stream.skipTo('*/')) {
        stream.match('*/');
        state.inBlockComment = false;
      } else {
        stream.skipToEnd();
      }

      return 'comment';
    }

    if (state.stringDelimiter) {
      let escaped = false;

      while (!stream.eol()) {
        const char = stream.next();

        if (!escaped && char === state.stringDelimiter) {
          state.stringDelimiter = null;
          break;
        }

        escaped = !escaped && char === '\\';
      }

      return 'string';
    }

    if (stream.eatSpace()) {
      return null;
    }

    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }

    if (stream.match('/*')) {
      state.inBlockComment = true;
      return 'comment';
    }

    const delimiter = stream.peek();

    if (delimiter === '"' || delimiter === "'") {
      state.stringDelimiter = stream.next() as '"' | "'";
      return 'string';
    }

    if (stream.match(/\b0x[0-9a-fA-F]+\b/)) {
      return 'number';
    }

    if (stream.match(/\b\d+(?:_\d+)*(?:\.\d+)?\b/)) {
      return 'number';
    }

    if (stream.match(/[{}()[\],.;]/)) {
      return null;
    }

    if (stream.match(/[A-Za-z_]\w*/)) {
      const word = stream.current();

      if (solidityKeywords.has(word)) {
        return 'keyword';
      }

      if (solidityTypes.has(word) || isSolidityIntegerType(word) || isSolidityBytesType(word)) {
        return 'typeName';
      }

      return 'variableName';
    }

    stream.next();
    return null;
  },
};

type TomlState = {
  inMultilineBasicString: boolean;
  inMultilineLiteralString: boolean;
};

const tomlParser: StreamParser<TomlState> = {
  startState() {
    return {
      inMultilineBasicString: false,
      inMultilineLiteralString: false,
    };
  },
  token(stream, state) {
    if (state.inMultilineBasicString) {
      if (stream.skipTo('"""')) {
        stream.match('"""');
        state.inMultilineBasicString = false;
      } else {
        stream.skipToEnd();
      }

      return 'string';
    }

    if (state.inMultilineLiteralString) {
      if (stream.skipTo("'''")) {
        stream.match("'''");
        state.inMultilineLiteralString = false;
      } else {
        stream.skipToEnd();
      }

      return 'string';
    }

    if (stream.eatSpace()) {
      return null;
    }

    if (stream.peek() === '#') {
      stream.skipToEnd();
      return 'comment';
    }

    if (stream.match('"""')) {
      state.inMultilineBasicString = true;
      return 'string';
    }

    if (stream.match("'''")) {
      state.inMultilineLiteralString = true;
      return 'string';
    }

    if (stream.match(/"(?:[^"\\]|\\.)*"/)) {
      return 'string';
    }

    if (stream.match(/'(?:[^']*)'/)) {
      return 'string';
    }

    if (stream.match(/[+-]?(?:0x[0-9a-fA-F_]+|0o[0-7_]+|0b[01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)/)) {
      return 'number';
    }

    if (stream.match(/\b(true|false)\b/)) {
      return 'atom';
    }

    if (stream.match(/[A-Za-z0-9_-]+(?=\s*=)/)) {
      return 'propertyName';
    }

    if (stream.match(/[{}\[\]=.,]/)) {
      return null;
    }

    stream.next();
    return null;
  },
};

const solidityLanguage = new LanguageSupport(StreamLanguage.define(solidityParser));
const tomlLanguage = new LanguageSupport(StreamLanguage.define(tomlParser));

export const supportedLanguages = [
  LanguageDescription.of({
    name: 'VUE',
    extensions: ['vue'],
    async load() {
      return import('@codemirror/lang-vue').then((module) => module.vue());
    },
  }),
  LanguageDescription.of({
    name: 'TS',
    extensions: ['ts'],
    async load() {
      return import('@codemirror/lang-javascript').then((module) => module.javascript({ typescript: true }));
    },
  }),
  LanguageDescription.of({
    name: 'JS',
    extensions: ['js', 'mjs', 'cjs'],
    async load() {
      return import('@codemirror/lang-javascript').then((module) => module.javascript());
    },
  }),
  LanguageDescription.of({
    name: 'TSX',
    extensions: ['tsx'],
    async load() {
      return import('@codemirror/lang-javascript').then((module) => module.javascript({ jsx: true, typescript: true }));
    },
  }),
  LanguageDescription.of({
    name: 'JSX',
    extensions: ['jsx'],
    async load() {
      return import('@codemirror/lang-javascript').then((module) => module.javascript({ jsx: true }));
    },
  }),
  LanguageDescription.of({
    name: 'HTML',
    extensions: ['html'],
    async load() {
      return import('@codemirror/lang-html').then((module) => module.html());
    },
  }),
  LanguageDescription.of({
    name: 'CSS',
    extensions: ['css'],
    async load() {
      return import('@codemirror/lang-css').then((module) => module.css());
    },
  }),
  LanguageDescription.of({
    name: 'SASS',
    extensions: ['sass'],
    async load() {
      return import('@codemirror/lang-sass').then((module) => module.sass({ indented: true }));
    },
  }),
  LanguageDescription.of({
    name: 'SCSS',
    extensions: ['scss'],
    async load() {
      return import('@codemirror/lang-sass').then((module) => module.sass({ indented: false }));
    },
  }),
  LanguageDescription.of({
    name: 'JSON',
    extensions: ['json'],
    async load() {
      return import('@codemirror/lang-json').then((module) => module.json());
    },
  }),
  LanguageDescription.of({
    name: 'Markdown',
    extensions: ['md'],
    async load() {
      return import('@codemirror/lang-markdown').then((module) => module.markdown());
    },
  }),
  LanguageDescription.of({
    name: 'Wasm',
    extensions: ['wat'],
    async load() {
      return import('@codemirror/lang-wast').then((module) => module.wast());
    },
  }),
  LanguageDescription.of({
    name: 'Python',
    extensions: ['py'],
    async load() {
      return import('@codemirror/lang-python').then((module) => module.python());
    },
  }),
  LanguageDescription.of({
    name: 'C++',
    extensions: ['cpp'],
    async load() {
      return import('@codemirror/lang-cpp').then((module) => module.cpp());
    },
  }),
  LanguageDescription.of({
    name: 'Rust',
    extensions: ['rs'],
    async load() {
      return import('@codemirror/lang-rust').then((module) => module.rust());
    },
  }),
  LanguageDescription.of({
    name: 'Solidity',
    extensions: ['sol'],
    async load() {
      return solidityLanguage;
    },
  }),
  LanguageDescription.of({
    name: 'TOML',
    extensions: ['toml'],
    async load() {
      return tomlLanguage;
    },
  }),
];

export async function getLanguage(fileName: string) {
  const languageDescription = LanguageDescription.matchFilename(supportedLanguages, fileName);

  if (languageDescription) {
    return await languageDescription.load();
  }

  return undefined;
}
