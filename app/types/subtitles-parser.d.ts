declare module 'subtitles-parser' {
  interface SubtitleItem {
    id: string;
    startTime: string;
    endTime: string;
    text: string;
  }

  export function fromSrt(data: string, useMs?: boolean): SubtitleItem[];
  export function toSrt(data: SubtitleItem[]): string;
}
