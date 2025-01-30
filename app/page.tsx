"use client";

import React, { useState } from "react";
import { parseSrt, formatSrt, combineBatchTexts, updateBatchWithTranslations, SubtitleEntry } from "./utils/srtUtils";
import { providers, getProvider } from "./utils/translationProviders";

export default function SrtTranslatorPage() {
  const [subs, setSubs] = useState<Map<number, SubtitleEntry>>(new Map());
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [translatedSubs, setTranslatedSubs] = useState<Map<number, SubtitleEntry>>(new Map())
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState("Chinese"); // Default: Chinese

  // Handle SRT File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const content = await file.text();
    const parsed = parseSrt(content);
    setSubs(parsed);
  };

  // Translation function
  const translateText = async (text: string) => {
    const selectedProvider = getProvider(provider);
    if (!selectedProvider) {
      throw new Error(`Provider ${provider} not found`);
    }
    return selectedProvider.translate(text, targetLang, apiKey);
  };

  // Process SRT Translation
  const handleTranslate = async () => {
    if (subs.size === 0) return;
    setIsTranslating(true);
    console.log(combineBatchTexts(subs));

    const translated = await translateText(combineBatchTexts(subs));

    console.log('translated: \n', translated);
    setTranslatedSubs(updateBatchWithTranslations(subs, translated));
    setIsTranslating(false);
  };

  // Download Translated SRT
  const handleDownload = () => {
    const srtData = formatSrt(translatedSubs);
    const blob = new Blob([srtData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "translated_subtitles.srt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="p-5">
      <h1 className="text-2xl font-bold">SRT Translator</h1>

      {/* Translation Provider Selection */}
      <div className="mt-4">
        <label className="block font-medium">Choose a Translation Provider:</label>
        <select className="border p-2 w-full" value={provider} onChange={e => setProvider(e.target.value)}>
          {providers.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* API Key Input (Only for OpenAI & DeepSeek) */}
      {getProvider(provider)?.requiresApiKey && (
        <div className="mt-4">
          <label className="block font-medium">Enter API Key:</label>
          <input
            className="border p-2 w-full"
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
        </div>
      )}

      {/* Language Selection */}
      <div className="mt-4">
        <label className="block font-medium">Target Language:</label>
        <input
          className="border p-2 w-full"
          type="text"
          value={targetLang}
          onChange={e => setTargetLang(e.target.value)}
          placeholder="Enter target language, e.g., Chinese"
        />
      </div>

      {/* File Upload */}
      <div className="mt-4">
        <input type="file" accept=".srt" onChange={handleFileUpload} />
      </div>

      {/* Translate Button */}
      {subs.size > 0 && !isTranslating && (
        <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={handleTranslate}>
          Translate SRT
        </button>
      )}

      {isTranslating && <p className="mt-4">Translating...</p>}

      {/* Download Translated File */}
      {translatedSubs.size > 0 && (
        <>
          <p className="mt-4">Translation complete!</p>
          <button className="mt-2 bg-green-500 text-white px-4 py-2 rounded" onClick={handleDownload}>
            Download Translated SRT
          </button>
        </>
      )}
    </main>
  );
}
