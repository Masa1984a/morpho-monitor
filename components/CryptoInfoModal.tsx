'use client';

import React, { useEffect, useState } from 'react';

interface CryptoSummary {
  asset: {
    id: string;
    symbol: string;
    name: string;
    category: string;
  };
  overview_md: string;
  market_1d_md: string;
  market_30d_md: string;
  outlook_md: string;
  confidence: number;
  citations: string[];
  sources: Array<{
    id: string;
    url: string;
    title: string | null;
    domain: string;
    publishedAt: string | null;
    relevanceScore: number;
  }>;
  run_meta: {
    id: string;
    kind: string;
    model: string;
    started_at: string;
    finished_at: string;
    token_in: number;
    token_out: number;
    cost_usd: string;
  };
  created_at: string;
}

interface CryptoInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
}

export function CryptoInfoModal({ isOpen, onClose, symbol }: CryptoInfoModalProps) {
  const [data, setData] = useState<CryptoSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && symbol) {
      fetchCryptoData();
    }
  }, [isOpen, symbol]);

  const fetchCryptoData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching crypto data for ${symbol}...`);
      const response = await fetch(`/api/crypto/${symbol}`);

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `Failed to fetch data: ${response.status}`);
      }

      const result = await response.json();
      console.log('Crypto data received:', result);
      setData(result);
    } catch (err) {
      console.error('Error fetching crypto data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch crypto data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderMarkdown = (markdown: string) => {
    // Simple markdown rendering - split by lines and format
    return markdown.split('\n').map((line, index) => {
      // Handle bullet points
      if (line.trim().startsWith('- ')) {
        return (
          <li key={index} className="ml-4">
            {line.trim().substring(2)}
          </li>
        );
      }
      // Handle bold text (simple implementation)
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{symbol}</h2>
            {data && <p className="text-sm text-gray-500">{data.asset.name}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morpho-blue"></div>
            </div>
          )}

          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
              <p className="text-danger font-semibold text-sm mb-2">Error Loading Crypto Data</p>
              <p className="text-danger text-sm">{error}</p>
              <button
                onClick={fetchCryptoData}
                className="mt-3 px-4 py-2 bg-morpho-blue text-white rounded-lg hover:bg-morpho-purple transition-colors text-sm font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-6">
              {/* Overview */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-morpho-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Overview
                </h3>
                <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">
                  {renderMarkdown(data.overview_md)}
                </div>
              </section>

              {/* 24h Market */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-morpho-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  24h Market
                </h3>
                <div className="text-sm text-gray-700 bg-blue-50 rounded-lg p-4">
                  {renderMarkdown(data.market_1d_md)}
                </div>
              </section>

              {/* 30d Market */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-morpho-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  30d Market
                </h3>
                <div className="text-sm text-gray-700 bg-purple-50 rounded-lg p-4">
                  {renderMarkdown(data.market_30d_md)}
                </div>
              </section>

              {/* Outlook */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-morpho-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Outlook
                </h3>
                <div className="text-sm text-gray-700 bg-green-50 rounded-lg p-4">
                  {renderMarkdown(data.outlook_md)}
                </div>
              </section>

              {/* Metadata */}
              <section className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>Confidence: {(data.confidence * 100).toFixed(0)}%</span>
                    <span>Sources: {data.sources.length}</span>
                  </div>
                  <span>Updated: {new Date(data.created_at).toLocaleString()}</span>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-morpho-blue text-white rounded-lg hover:bg-morpho-purple transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
