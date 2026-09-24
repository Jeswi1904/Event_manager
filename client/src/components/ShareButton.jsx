import { useState } from 'react';
import { createInvite } from '../services/api';
import { useUser } from '../context/UserContext';

/**
 * ShareButton
 *
 * Only renders when isRSVPd is true.
 *
 * When clicked:
 *   1. Calls POST /api/events/:eventId/invite to get a unique share URL.
 *   2. Copies the URL to clipboard.
 *   3. Shows a visible fallback (the URL) if clipboard fails.
 *
 * The share URL encodes a unique inviteCode that the backend uses to:
 *   - Track link opens (clicks)
 *   - Associate invited RSVPs via shareToken
 *   - Calculate Friends Attending server-side
 */
const ShareButton = ({ eventId, isRSVPd }) => {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isRSVPd || !currentUser) return null;

  const handleShare = async () => {
    setLoading(true);
    try {
      const data = await createInvite(eventId, currentUser._id);
      const url = data.shareUrl;
      setShareUrl(url);

      // Attempt clipboard copy
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (_) {
        // Clipboard not available — the URL is shown as a fallback below
        setCopied(false);
      }
    } catch (err) {
      console.error('Share failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <button
        id={`share-btn-${eventId}`}
        className={`share-btn${copied ? ' share-btn-copied' : ''}`}
        onClick={handleShare}
        disabled={loading}
        aria-label="Generate and copy share link"
      >
        {loading ? '⏳' : copied ? '✓' : '🔗'}
        {loading ? 'Generating…' : copied ? 'Copied!' : 'Share'}
      </button>

      {/* Visible URL fallback if clipboard API unavailable */}
      {shareUrl && !copied && (
        <div className="share-url-display" title="Copy this link">
          {shareUrl}
        </div>
      )}
    </div>
  );
};

export default ShareButton;
