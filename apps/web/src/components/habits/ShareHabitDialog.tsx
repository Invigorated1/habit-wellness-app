'use client';

import { useState } from 'react';
import { Habit, HabitShare } from '@habit-app/shared';
import { trackEvent, AnalyticsEvents } from '@/lib/posthog';

interface ShareHabitDialogProps {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareHabitDialog({ habit, isOpen, onClose }: ShareHabitDialogProps) {
  const [shareType, setShareType] = useState<HabitShare['shareType']>('progress');
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShare = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/habits/${habit.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareType,
          message: message.trim() || undefined,
          isPublic,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to share habit');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);

      trackEvent(AnalyticsEvents.FEATURE_USED, {
        feature: 'share_habit',
        habit_id: habit.id,
        share_type: shareType,
        is_public: isPublic,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      trackEvent(AnalyticsEvents.FEATURE_USED, {
        feature: 'copy_share_link',
        habit_id: habit.id,
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getShareMessage = () => {
    switch (shareType) {
      case 'progress':
        return `Check out my ${habit.name} progress! ${habit.streak} day streak!`;
      case 'achievement':
        return `I've maintained my ${habit.name} habit for ${habit.streak} days!`;
      case 'milestone':
        return `Milestone reached! ${habit.streak} days of ${habit.name}!`;
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Share Your Progress</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close dialog"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!shareUrl ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Share Type</label>
              <div className="space-y-2">
                {(['progress', 'achievement', 'milestone'] as const).map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="radio"
                      name="shareType"
                      value={type}
                      checked={shareType === type}
                      onChange={(e) => setShareType(e.target.value as HabitShare['shareType'])}
                      className="mr-2"
                    />
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">
                Personal Message (Optional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={getShareMessage()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Make this share public</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Public shares can be discovered by anyone with the link
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleShare}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sharing...' : 'Share'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium mb-2">Successfully shared!</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message || getShareMessage())}&url=${encodeURIComponent(shareUrl)}`, '_blank')}
                className="flex-1 px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500"
              >
                Share on Twitter
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}