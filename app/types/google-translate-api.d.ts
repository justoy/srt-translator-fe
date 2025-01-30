declare module 'google-translate-api' {
  interface TranslateOptions {
    to: string;
  }

  interface TranslateResult {
    text: string;
  }

  function translate(text: string, options: TranslateOptions): Promise<TranslateResult>;

  export = translate;
}
