"use client";

import React, { useState, useCallback } from "react";
import { parseSrt, formatSrt, combineBatchTexts, updateBatchWithTranslations, SubtitleEntry, splitIntoBatches } from "./utils/srtUtils";
import { providers, getProvider } from "./utils/translationProviders";

export default function SrtTranslatorPage() {
  const [subs, setSubs] = useState<Map<number, SubtitleEntry>>(new Map());
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [translatedSubs, setTranslatedSubs] = useState<Map<number, SubtitleEntry>>(new Map());
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState("Chinese");
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [batchSize, setBatchSize] = useState(200);

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

  // Process batch translation
  const translateBatch = useCallback(async (batch: Map<number, SubtitleEntry>) => {
    const batchText = combineBatchTexts(batch);
    const translated = await translateText(batchText);
    return updateBatchWithTranslations(batch, translated);
  }, [targetLang, provider, apiKey]);

  // Process SRT Translation with batches
  const handleTranslate = async () => {
    if (subs.size === 0) return;
    setIsTranslating(true);
    setProgress({ completed: 0, total: 0 });

    try {
      const batches = splitIntoBatches(subs, batchSize);
      setProgress(prev => ({ ...prev, total: batches.length }));

      // Create a new Map to store all translated entries
      const allTranslated = new Map<number, SubtitleEntry>();
      
      // Process batches concurrently in groups of 3
      for (let i = 0; i < batches.length; i += 3) {
        const batchGroup = batches.slice(i, i + 3);
        const translations = await Promise.all(
          batchGroup.map(batch => translateBatch(batch))
        );
        
        // Merge translated batches into the final map
        translations.forEach(translatedBatch => {
          translatedBatch.forEach((value, key) => {
            allTranslated.set(key, value);
          });
        });
        
        setProgress(prev => ({ 
          ...prev, 
          completed: Math.min(prev.completed + batchGroup.length, prev.total) 
        }));
      }

      setTranslatedSubs(allTranslated);
    } catch (error) {
      console.error('Translation error:', error);
      alert('An error occurred during translation. Please try again.');
    } finally {
      setIsTranslating(false);
    }
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

      {/* Batch Size Selection */}
      <div className="mt-4">
        <label className="block font-medium">Batch Size:</label>
        <input
          className="border p-2 w-full"
          type="number"
          min="1"
          max="200"
          value={batchSize}
          onChange={e => setBatchSize(Math.max(1, Math.min(200, parseInt(e.target.value) || 20)))}
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

      {/* Translation Progress */}
      {isTranslating && (
        <div className="mt-4">
          <div className="flex justify-between mb-2">
            <span>Translating...</span>
            <span>{Math.round((progress.completed / progress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Completed {progress.completed} of {progress.total} batches
          </p>
        </div>
      )}

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
