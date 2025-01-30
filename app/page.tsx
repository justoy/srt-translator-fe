'use client';

import React, { useState } from 'react';
import {
  parseSrt,
  formatSrt,
  combineBatchTexts,
  updateBatchWithTranslations,
  SubtitleEntry,
  splitIntoBatches,
} from './utils/srtUtils';
import { providers, getProvider } from './utils/translationProviders';

export default function SrtTranslatorPage() {
  const [subs, setSubs] = useState<Map<number, SubtitleEntry>>(new Map());
  const [provider, setProvider] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('srtTranslator_provider') || 'openai';
    }
    return 'openai';
  });
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('srtTranslator_apiKey') || '';
    }
    return '';
  });
  const [translatedSubs, setTranslatedSubs] = useState<Map<number, SubtitleEntry>>(new Map());
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('srtTranslator_targetLang') || 'Chinese';
    }
    return 'Chinese';
  });
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const batchSize = 100;
  const concurrency = 6;

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
  const translateBatch = async (batch: Map<number, SubtitleEntry>) => {
    const batchText = combineBatchTexts(batch);
    const translated = await translateText(batchText);
    return updateBatchWithTranslations(batch, translated);
  };

  // Process SRT Translation with batches
  const handleTranslate = async () => {
    if (subs.size === 0) return;
    setIsTranslating(true);
    setProgress({ completed: 0, total: 0 });

    try {
      const batches = splitIntoBatches(subs, batchSize);
      setProgress((prev) => ({ ...prev, total: batches.length }));

      // Create a new Map to store all translated entries
      const allTranslated = new Map<number, SubtitleEntry>();

      // Process batches concurrently
      for (let i = 0; i < batches.length; i += concurrency) {
        const batchGroup = batches.slice(i, i + concurrency);
        const translations = await Promise.all(batchGroup.map((batch) => translateBatch(batch)));

        // Merge translated batches into the final map
        translations.forEach((translatedBatch) => {
          translatedBatch.forEach((value, key) => {
            allTranslated.set(key, value);
          });
        });

        setProgress((prev) => ({
          ...prev,
          completed: Math.min(prev.completed + batchGroup.length, prev.total),
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
    const blob = new Blob([srtData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'translated_subtitles.srt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800">SRT Translator</h1>
        <a 
          href="https://github.com/justoy/srt-translator-fe"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-900"
        >
          <svg 
            height="24" 
            width="24" 
            viewBox="0 0 16 16" 
            className="inline-block"
          >
            <path 
              fillRule="evenodd"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              fill="currentColor"
            />
          </svg>
          <span className="ml-2">GitHub</span>
        </a>
      </div>

      {/* Translation Provider Selection */}
      <div className="mt-4">
        <label className="block font-medium text-gray-700">Choose a Translation Provider:</label>
        <select
          className="border border-gray-300 p-2 w-full rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value);
            localStorage.setItem('srtTranslator_provider', e.target.value);
          }}
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* API Key Input (Only for OpenAI & DeepSeek) */}
      {getProvider(provider)?.requiresApiKey && (
        <div className="mt-4">
          <label className="block font-medium text-gray-700">Enter API Key:</label>
          <input
            className="border border-gray-300 p-2 w-full rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              localStorage.setItem('srtTranslator_apiKey', e.target.value);
            }}
            placeholder="Enter your API key"
          />
        </div>
      )}

      {/* Language Selection */}
      <div className="mt-4">
        <label className="block font-medium text-gray-700">Target Language:</label>
        <input
          className="border border-gray-300 p-2 w-full rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          value={targetLang}
          onChange={(e) => {
            setTargetLang(e.target.value);
            localStorage.setItem('srtTranslator_targetLang', e.target.value);
          }}
          placeholder="Enter target language, e.g., Chinese"
        />
      </div>


      {/* File Upload */}
      <div className="mt-4">
        <input type="file" accept=".srt" onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
      </div>

      {/* Translate Button */}
      {subs.size > 0 && !isTranslating && (
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 transition duration-300" onClick={handleTranslate}>
          Translate SRT
        </button>
      )}

      {/* Translation Progress */}
      {isTranslating && (
        <div className="mt-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-700">Translating...</span>
            <span className="text-gray-700">{Math.round((progress.completed / progress.total) * 100)}%</span>
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
          <p className="mt-4 text-gray-700">Translation complete!</p>
          <button
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-green-700 transition duration-300"
            onClick={handleDownload}
          >
            Download Translated SRT
          </button>
        </>
      )}
    </main>
  );
}
