'use client';

import React, { useState, useEffect, useRef } from 'react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  published_at: string;
}

interface BlogPostDetail {
  id: string;
  title: string;
  content_md: string;
  image_url: string | null;
  language: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

interface BlogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Language = 'en' | 'ja' | 'es' | 'pt' | 'ko' | 'zh' | 'tw' | 'th';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '简体中文', flag: '🇨🇳' },
  { code: 'tw', label: '繁體中文', flag: '🇹🇼' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

// Simple markdown to HTML converter for basic formatting
function parseMarkdown(md: string): string {
  let html = md;

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto my-3"><code>$2</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-morpho-blue hover:text-morpho-purple underline" target="_blank" rel="noopener noreferrer">$1</a>');

  // Unordered lists
  html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/(<li class="ml-4">.*<\/li>)/s, '<ul class="list-disc list-inside my-2">$1</ul>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p class="mb-3">');
  html = '<p class="mb-3">' + html + '</p>';

  return html;
}

export function BlogModal({ isOpen, onClose }: BlogModalProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postDetails, setPostDetails] = useState<Map<string, BlogPostDetail>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  const contentRef = useRef<HTMLDivElement>(null);
  const limit = 5;

  // Fetch initial posts when modal opens or language changes
  useEffect(() => {
    if (isOpen) {
      // Reset and fetch new posts when language changes
      setPosts([]);
      setPostDetails(new Map());
      setOffset(0);
      setHasMore(true);
      fetchPosts(0);
    }
  }, [isOpen, selectedLang]);

  // Reset state when modal closes
  const handleClose = () => {
    setPosts([]);
    setPostDetails(new Map());
    setOffset(0);
    setHasMore(true);
    setError('');
    setSelectedLang('en'); // Reset to English
    onClose();
  };

  const handleLanguageChange = (lang: Language) => {
    if (lang !== selectedLang) {
      setSelectedLang(lang);
    }
  };

  const fetchPosts = async (currentOffset: number) => {
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/blog/posts?limit=${limit}&offset=${currentOffset}&lang=${selectedLang}`);

      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }

      const data = await response.json();

      if (data.posts && data.posts.length > 0) {
        setPosts(prev => [...prev, ...data.posts]);
        setOffset(currentOffset + data.posts.length);

        // Fetch details for each post
        for (const post of data.posts) {
          fetchPostDetail(post.id);
        }

        // Check if there are more posts
        if (data.posts.length < limit || currentOffset + data.posts.length >= data.meta.total) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      setError('Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPostDetail = async (postId: string) => {
    try {
      const response = await fetch(`/api/blog/posts/${postId}?lang=${selectedLang}`);

      if (!response.ok) {
        throw new Error('Failed to fetch post detail');
      }

      const detail = await response.json();
      setPostDetails(prev => new Map(prev).set(postId, detail));
    } catch (err) {
      console.error(`Error fetching post detail for ${postId}:`, err);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;

    if (bottom && hasMore && !isLoading) {
      fetchPosts(offset);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-end items-center mb-4">
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Language Selector */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-2">Language</h4>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedLang === lang.code
                      ? 'bg-morpho-blue text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={isLoading}
                >
                  <span className="mr-1">{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto p-6"
          onScroll={handleScroll}
        >
          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 mb-4">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {posts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No blog posts available</p>
            </div>
          )}

          {posts.map((post, index) => {
            const detail = postDetails.get(post.id);

            return (
              <article key={post.id} className={`mb-8 ${index > 0 ? 'border-t border-gray-200 pt-8' : ''}`}>
                {/* Image */}
                {post.image_url && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-auto object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Published Date */}
                <p className="text-sm text-gray-500 mb-4">
                  {new Date(post.published_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>

                {/* Content */}
                {detail ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(detail.content_md) }}
                  />
                ) : (
                  <div className="text-gray-600 mb-3">
                    {post.excerpt}
                  </div>
                )}

                {!detail && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading content...</span>
                  </div>
                )}
              </article>
            );
          })}

          {isLoading && posts.length > 0 && (
            <div className="flex justify-center py-4">
              <div className="flex items-center space-x-2 text-gray-500">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading more posts...</span>
              </div>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No more posts
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
