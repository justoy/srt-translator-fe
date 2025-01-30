import * as subtitlesParser from 'subtitles-parser';

export interface SubtitleEntry {
    number: number;
    timestamp: string;
    text: string;
}

export function parseSrt(content: string): SubtitleEntry[] {
    /** Parse SRT content into a list of subtitle entries **/
    const subs = subtitlesParser.fromSrt(content, true);

    const entries: SubtitleEntry[] = subs.map((sub, index) => {
        const entry: SubtitleEntry = {
            number: index + 1,
            timestamp: `${sub.startTime} --> ${sub.endTime}`,
            text: sub.text
        };
        return entry;
    });
    
    return entries;
}

export function formatSrt(entries: SubtitleEntry[]): string {
    /** Format subtitle entries back to SRT format **/    
    const subs = entries.map(entry => {
        const [start, end] = entry.timestamp.split(" --> ");
        return {
            id: entry.number,
            startTime: start,
            endTime: end,
            text: entry.text
        };
    });
    
    return subtitlesParser.toSrt(subs);    
}

export function combineBatchTexts(batch: SubtitleEntry[]): string {
  const batchTexts = batch.map(entry => `[${entry.number}] ${entry.text}`);
  return batchTexts.join("\n");
}

export function updateBatchWithTranslations(batch: SubtitleEntry[], translations: string): SubtitleEntry[] {
  const translatedPairs = parseTranslations(translations);
  return translatedPairs.map((pair, _) => {
    const sub = batch[pair.number-1];
    return {
      number: sub.number,
      timestamp: sub.timestamp,
      text: pair.text
  }});
}

function parseTranslations(text: string): { number: number; text: string }[] {
  const pattern = /\[(\d+)]\s*(.*?)(?=\n\[\d+]|$)/gs;
  const matches = [...text.matchAll(pattern)];

  return matches.map(match => ({
      number: parseInt(match[1], 10),
      text: match[2].trim()
  }));
}