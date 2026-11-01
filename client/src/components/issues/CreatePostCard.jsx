import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, MapPin, Tag } from 'lucide-react';
import { Card, Avatar } from '../ui';

function CreatePostCard() {
  return (
    <Card className="mb-6">
      <div className="flex items-center gap-4 mb-4">
        <Avatar name="Citizen" />
        <Link
          to="/report"
          className="flex-1 bg-surface-muted hover:bg-surface-border/50 transition-colors border border-surface-border rounded-xl px-4 py-3 text-ink-muted text-sm text-left"
        >
          What&apos;s happening in your community?
        </Link>
      </div>

      <div className="flex items-center justify-between border-t border-surface-border pt-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/report"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-muted text-ink-secondary transition-colors"
          >
            <Camera className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium hidden sm:inline">Upload Photo</span>
          </Link>
          <Link
            to="/report"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-muted text-ink-secondary transition-colors"
          >
            <MapPin className="w-4 h-4 text-critical-500" />
            <span className="text-sm font-medium hidden sm:inline">Location</span>
          </Link>
          <Link
            to="/report"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-muted text-ink-secondary transition-colors"
          >
            <Tag className="w-4 h-4 text-warning-500" />
            <span className="text-sm font-medium hidden sm:inline">Category</span>
          </Link>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-colors"
        >
          Report Civic Issue
        </Link>
      </div>
    </Card>
  );
}

export default CreatePostCard;
