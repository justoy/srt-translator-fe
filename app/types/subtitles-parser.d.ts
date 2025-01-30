declare module 'subtitles-parser' {
  interface SubtitleItem {
    id: string | number;
    startTime: string | number;
    endTime: string | number;
    text: string;
  }

  export function fromSrt(data: string, useMs?: boolean): SubtitleItem[];
  export function toSrt(data: SubtitleItem[]): string;
}
