import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Plus, Trash2, Bookmark, BookmarkCheck, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Note, useAddNote, useDeleteNote, useUpdateNote } from '@/hooks/useNotes';

interface NotesDrawerProps {
  open: boolean;
  onClose: () => void;
  notes: Note[];
  batchId: string;
  contentType: string;
  contentIndex: number;
  currentTimestamp: number;
  onSeek?: (timestamp: number) => void;
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function NotesDrawer({
  open, onClose, notes, batchId, contentType, contentIndex, currentTimestamp, onSeek,
}: NotesDrawerProps) {
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const addNote = useAddNote();
  const deleteNote = useDeleteNote();
  const updateNote = useUpdateNote();

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setIsAdding(true);
    try {
      await addNote.mutateAsync({
        batchId,
        contentType,
        contentIndex,
        timestampPos: currentTimestamp,
        text: newNote.trim(),
      });
      setNewNote('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleBookmark = (note: Note) => {
    updateNote.mutate({ id: note.id, isBookmark: !note.is_bookmark });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm glass-card border-l border-white/10 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Notes</h3>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{notes.length}</span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Add note */}
            <div className="p-4 border-b border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>at {contentType === 'video' ? formatTimestamp(currentTimestamp) : `page ${Math.floor(currentTimestamp)}`}</span>
              </div>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write a note..."
                className="min-h-[60px] resize-none glass-card border-white/10 text-sm"
              />
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!newNote.trim() || isAdding}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </Button>
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notes.length === 0 ? (
                <div className="text-center py-8">
                  <StickyNote className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                </div>
              ) : (
                notes.map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <button
                        onClick={() => onSeek?.(note.timestamp_pos)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        {contentType === 'video' ? formatTimestamp(note.timestamp_pos) : `Page ${Math.floor(note.timestamp_pos)}`}
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleBookmark(note)}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          {note.is_bookmark ? (
                            <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteNote.mutate(note.id)}
                          className="p-1 hover:bg-red-500/20 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80">{note.text}</p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
