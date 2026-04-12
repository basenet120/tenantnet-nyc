import Link from "next/link";
import { StatusBadge } from "./status-badge";

type PostCardProps = {
  id: string;
  title: string;
  body: string;
  authorLabel: string;
  sectionName: string;
  status: string | null;
  isPinned: boolean;
  createdAt: Date;
  commentCount: number;
  imageCount: number;
};

export function PostCard({ id, title, body, authorLabel, sectionName, status, isPinned, createdAt, commentCount, imageCount }: PostCardProps) {
  return (
    <Link href={`/post/${id}`} className="block">
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isPinned && <span className="text-xs text-amber-600 font-medium">PINNED</span>}
              <span className="text-xs text-gray-500">{sectionName}</span>
            </div>
            <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{body}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span>{authorLabel}</span>
              <span>{createdAt.toLocaleDateString()}</span>
              {commentCount > 0 && <span>{commentCount} comments</span>}
              {imageCount > 0 && <span>{imageCount} photos</span>}
            </div>
          </div>
          {status && <StatusBadge status={status} />}
        </div>
      </div>
    </Link>
  );
}
