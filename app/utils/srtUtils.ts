import parser from "subtitles-parser";

export function parseSrt(content: string) {
  return parser.fromSrt(content, true); 
  // 'true' means remove empty lines
}

export function buildSrt(jsonSubtitles: any[]) {
  return parser.toSrt(jsonSubtitles);
}
