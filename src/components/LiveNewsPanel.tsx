import React, { useEffect, useState } from 'react';
import { Tv, Volume2, VolumeX, RefreshCw, ExternalLink } from 'lucide-react';

interface VideoResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  publishedAt: string;
}

interface Props {
  query: string;
}

export default function LiveNewsPanel({ query }: Props) {
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unmutedIdx, setUnmutedIdx] = useState<number | null>(null);

  const fetchVideos = async () => {
    if (!query) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.videos && data.videos.length > 0) {
        setVideos(data.videos.filter((v: VideoResult) => v.id));
      } else {
        setError(data.message || 'No videos found');
      }
    } catch (err) {
      setError('Failed to fetch news videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [query]);

  if (!query) return null;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Tv className="w-4 h-4 text-red-500" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          </div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
            Live News Feed
          </h3>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
            {videos.length} streams
          </span>
        </div>
        <button
          onClick={fetchVideos}
          disabled={loading}
          className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-[10px] uppercase tracking-widest">Searching relevant news...</span>
          </div>
        </div>
      ) : error && videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500 gap-2">
          <Tv className="w-6 h-6 opacity-50" />
          <span className="text-[10px] uppercase tracking-widest">{error}</span>
          <span className="text-[9px] text-slate-400 dark:text-slate-600">
            Add YOUTUBE_API_KEY to .env.local to enable
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          {videos.slice(0, 4).map((video, idx) => (
            <div key={video.id} className="relative group border border-slate-100 dark:border-slate-700/50">
              {/* YouTube Embed */}
              <div className="relative aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=${unmutedIdx === idx ? 0 : 1}&rel=0&modestbranding=1&playsinline=1`}
                  title={video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />

                {/* Overlay controls */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setUnmutedIdx(unmutedIdx === idx ? null : idx)}
                    className="w-6 h-6 flex items-center justify-center bg-black/70 rounded-full text-white hover:bg-black/90 transition-colors"
                    title={unmutedIdx === idx ? 'Mute' : 'Unmute'}
                  >
                    {unmutedIdx === idx ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  </button>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 flex items-center justify-center bg-black/70 rounded-full text-white hover:bg-black/90 transition-colors"
                    title="Open in YouTube"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Channel badge */}
                <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded-sm px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] text-white font-bold truncate max-w-[150px] block">{video.channel}</span>
                </div>
              </div>

              {/* Title bar */}
              <div className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[9px] text-slate-700 dark:text-slate-300 font-semibold leading-tight line-clamp-2 min-h-[24px]" title={video.title}>
                  {video.title?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Correction 3: News Sources Strip */}
      {videos.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sources</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {videos.slice(0, 4).map((video, idx) => {
              const timeAgo = (() => {
                const diff = Date.now() - new Date(video.publishedAt).getTime();
                const hours = Math.floor(diff / 3600000);
                if (hours < 1) return 'just now';
                if (hours < 24) return `${hours}h ago`;
                return `${Math.floor(hours / 24)}d ago`;
              })();
              return (
                <a
                  key={idx}
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <span className="text-[10px]">📡</span>
                  <span className="font-semibold">{video.channel}</span>
                  <span className="text-slate-400 dark:text-slate-600">·</span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono">{timeAgo}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
