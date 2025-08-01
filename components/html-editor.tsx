'use client';

import { EditorView } from '@codemirror/view';
import { EditorState, Transaction } from '@codemirror/state';
import { html } from '@codemirror/lang-html';
import { basicSetup } from 'codemirror';
import React, { memo, useEffect, useRef } from 'react';
import { Suggestion } from '@/lib/db/schema';

// Custom bright theme for better visibility
const brightTheme = {
  '&': {
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },
  '.cm-content': {
    caretColor: '#1a1a1a',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#1a1a1a',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#b3d4fc',
  },
  '.cm-panels': {
    backgroundColor: '#f5f5f5',
    color: '#1a1a1a',
  },
  '.cm-panels.cm-panels-top': {
    borderBottom: '1px solid #ddd',
  },
  '.cm-panels.cm-panels-bottom': {
    borderTop: '1px solid #ddd',
  },
  '.cm-searchMatch': {
    backgroundColor: '#ffff0054',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#ff6a6a',
  },
  '.cm-activeLine': {
    backgroundColor: '#f0f0f0',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#aafe661a',
  },
  '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
    color: '#1a1a1a',
    outline: '1px solid #1a1a1a',
  },
  '.cm-gutters': {
    backgroundColor: '#f5f5f5',
    color: '#6a6a6a',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#e0e0e0',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#888',
  },
  '.cm-tooltip': {
    border: '1px solid #ddd',
    backgroundColor: '#f5f5f5',
  },
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#b3d4fc',
      color: '#1a1a1a',
    },
  },
};

type EditorProps = {
  content: string;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  status: 'streaming' | 'idle';
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  suggestions: Array<Suggestion>;
};

function PureHtmlEditor({ content, onSaveContent, status }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      const startState = EditorState.create({
        doc: content,
        extensions: [basicSetup, html(), EditorView.theme(brightTheme)],
      });

      editorRef.current = new EditorView({
        state: startState,
        parent: containerRef.current,
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
    // NOTE: we only want to run this effect once
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const transaction = update.transactions.find(
            (tr) => !tr.annotation(Transaction.remote),
          );

          if (transaction) {
            const newContent = update.state.doc.toString();
            onSaveContent(newContent, true);
          }
        }
      });

      const currentSelection = editorRef.current.state.selection;

      const newState = EditorState.create({
        doc: editorRef.current.state.doc,
        extensions: [basicSetup, html(), EditorView.theme(brightTheme), updateListener],
        selection: currentSelection,
      });

      editorRef.current.setState(newState);
    }
  }, [onSaveContent]);

  useEffect(() => {
    if (editorRef.current && content) {
      const currentContent = editorRef.current.state.doc.toString();

      if (status === 'streaming' || currentContent !== content) {
        const transaction = editorRef.current.state.update({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: content,
          },
          annotations: [Transaction.remote.of(true)],
        });

        editorRef.current.dispatch(transaction);
      }
    }
  }, [content, status]);

  return (
    <div
      className="relative not-prose size-full text-sm [&_.cm-editor]:!opacity-100 [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-y-auto [&_.cm-scroller]:custom-scrollbar"
      ref={containerRef}
    />
  );
}

export const HtmlEditor = memo(PureHtmlEditor); 