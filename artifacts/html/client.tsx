import { Artifact } from '@/components/create-artifact';
import { HtmlEditor } from '@/components/html-editor';
import {
  CopyIcon,
  EyeIcon,
  CodeIcon,
  RedoIcon,
  UndoIcon,
  MessageIcon,
} from '@/components/icons';
import { toast } from 'sonner';
import { useState } from 'react';
import { DiffView } from '@/components/diffview';
import { DocumentSkeleton } from '@/components/document-skeleton';

interface HtmlArtifactMetadata {
  viewMode: 'code' | 'preview' | 'split';
}

export const htmlArtifact = new Artifact<'html', HtmlArtifactMetadata>({
  kind: 'html' as const,
  description: 'Useful for HTML templates and web content with live preview',
  initialize: async ({ setMetadata }) => {
    setMetadata({
      viewMode: 'split',
    });
  },
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'data-htmlDelta' || streamPart.type === 'data-codeDelta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible: true,
        status: 'streaming',
      }));
    }
  },
  content: ({
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading,
    metadata,
    setMetadata,
  }) => {
    if (isLoading) {
      return <DocumentSkeleton artifactKind="code" />;
    }

    if (mode === 'diff') {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);

      return <DiffView oldContent={oldContent} newContent={newContent} />;
    }

    const viewMode = metadata?.viewMode || 'split';

    return (
      <div className="h-full flex flex-col">
        {/* View Mode Toggle */}
        <div className="flex gap-1 p-2 border-b bg-muted/30">
          <button
            onClick={() => setMetadata({ viewMode: 'code' })}
            className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition-colors ${
              viewMode === 'code'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted'
            }`}
          >
            <CodeIcon size={16} />
            <span>Code</span>
          </button>
          <button
            onClick={() => setMetadata({ viewMode: 'preview' })}
            className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition-colors ${
              viewMode === 'preview'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted'
            }`}
          >
            <EyeIcon size={16} />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setMetadata({ viewMode: 'split' })}
            className={`px-3 py-1 text-sm rounded flex items-center gap-1 transition-colors ${
              viewMode === 'split'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted'
            }`}
          >
            <span>Split</span>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor */}
          {(viewMode === 'code' || viewMode === 'split') && (
            <div className={viewMode === 'split' ? 'w-1/2' : 'w-full'}>
              <HtmlEditor
                content={content}
                onSaveContent={onSaveContent}
                isCurrentVersion={isCurrentVersion}
                status={status}
                currentVersionIndex={currentVersionIndex}
                suggestions={[]}
              />
            </div>
          )}

          {/* HTML Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2 border-l' : 'w-full'} bg-white`}>
              <iframe
                srcDoc={content || '<html><body><p>Start typing HTML to see preview...</p></body></html>'}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                title="HTML Preview"
              />
            </div>
          )}
        </div>
      </div>
    );
  },
  actions: [
    {
      icon: <EyeIcon size={18} />,
      description: 'Toggle preview mode',
      onClick: ({ metadata, setMetadata }) => {
        const currentMode = metadata?.viewMode || 'split';
        const nextMode = currentMode === 'preview' ? 'code' : 'preview';
        setMetadata({ viewMode: nextMode });
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy HTML to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('HTML copied to clipboard!');
      },
    },
  ],
  toolbar: [
    {
      icon: <MessageIcon />,
      description: 'Add semantic HTML',
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Please improve the HTML structure with semantic elements and accessibility features',
            },
          ],
        });
      },
    },
    {
      icon: <EyeIcon />,
      description: 'Add styling',
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Please add CSS styling to make this HTML template look modern and responsive',
            },
          ],
        });
      },
    },
  ],
}); 