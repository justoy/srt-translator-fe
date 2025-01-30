import * as subtitlesParser from 'subtitles-parser';

export interface SubtitleEntry {
  number: number;
  startTime: string;
  endTime: string;
  text: string;
}

export function parseSrt(content: string): Map<number, SubtitleEntry> {
  /** Parse SRT content into a Map of subtitle entries **/
  const subs = subtitlesParser.fromSrt(content, true);

  const entriesMap: Map<number, SubtitleEntry> = new Map();

  subs.forEach((sub, index) => {
      const entry: SubtitleEntry = {
          number: Number(sub.id),
          startTime: sub.startTime,
          endTime: sub.endTime,
          text: sub.text
      };
      entriesMap.set(entry.number, entry);
  });

  return entriesMap;
}


export function formatSrt(entryMap: Map<number, SubtitleEntry>): string {
    /** Format subtitle entries back to SRT format **/    
    const entries = mapToSortedArray(entryMap);
    const subs = entries.map(entry => {
        const [start, end] = [entry.startTime, entry.endTime]
        return {
            id: String(entry.number),
            startTime: start,
            endTime: end,
            text: entry.text
        };
    });
    
    return subtitlesParser.toSrt(subs);    
}

export function combineBatchTexts(batchMap: Map<number, SubtitleEntry>): string {
  const batch = mapToSortedArray(batchMap);
  const batchTexts = batch.map(entry => `[${entry.number}] ${entry.text}`);
  return batchTexts.join("\n");
}

export function updateBatchWithTranslations(
  batchMap: Map<number, SubtitleEntry>,
  translations: string
): Map<number, SubtitleEntry> {
  const translatedPairs = parseTranslations(translations);
  const updatedBatch = new Map(batchMap); // Clone the original batch to avoid mutation

  translatedPairs.forEach((pair) => {
    const sub = updatedBatch.get(pair.number);
    if (sub) {
      updatedBatch.set(pair.number, {
        ...sub, // Preserve existing startTime and endTime
        text: pair.text
      });
    } else {
      console.warn(`Subtitle entry with number ${pair.number} not found in batch.`);
    }
  });

  return updatedBatch;
}



function parseTranslations(text: string): { number: number; text: string }[] {
  const pattern = /\[(\d+)]\s*([\s\S]*?)(?=\n\[\d+]|$)/g;
  const matches = [...text.matchAll(pattern)];

  return matches.map(match => ({
      number: parseInt(match[1], 10),
      text: match[2].trim()
  }));
}

function mapToSortedArray(entryMap: Map<number, SubtitleEntry>): SubtitleEntry[] {
  return [...entryMap.values()].sort((a, b) => a.number - b.number);
}
