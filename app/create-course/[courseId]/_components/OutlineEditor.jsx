'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { HiPencil, HiTrash, HiCheck, HiXMark, HiSparkles, HiPlus, HiBars3 } from 'react-icons/hi2';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveOutlineAction } from '@/app/actions/outline';
import { updateCourseStatus, reorderChaptersAction } from '@/app/actions/course';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableChapter({ ch, index, editingIndex, draftName, draftAbout, beginEdit, saveEdit, cancelEdit, removeChapter, setDraftName, setDraftAbout }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Drag to reorder"
          >
            <HiBars3 className="h-5 w-5" />
          </button>
          <div className="flex-1">
            {editingIndex === index ? (
              <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} />
            ) : (
              <h4 className="font-semibold text-base">
                {index + 1}. {ch.name}
              </h4>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Duration: {ch.duration}
            </p>
            {ch.difficulty && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {ch.difficulty}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {editingIndex === index ? (
            <>
              <Button size="icon" variant="ghost" onClick={() => saveEdit(index)} aria-label="Save">
                <HiCheck className="h-4 w-4 text-green-600" />
              </Button>
              <Button size="icon" variant="ghost" onClick={cancelEdit} aria-label="Cancel">
                <HiXMark className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button size="icon" variant="ghost" onClick={() => beginEdit(index)} aria-label="Edit chapter">
                <HiPencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => removeChapter(index)} aria-label="Remove chapter">
                <HiTrash className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editingIndex === index ? (
          <Textarea value={draftAbout} onChange={(e) => setDraftAbout(e.target.value)} rows={3} />
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">{ch.about}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function OutlineEditor({ courseId, initialChapters }) {
  const router = useRouter();
  const [chapters, setChapters] = useState(initialChapters);
  const [editingIndex, setEditingIndex] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [draftAbout, setDraftAbout] = useState('');
  const [saving, startSaving] = useTransition();
  const [generating, setGenerating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const beginEdit = (i) => {
    setEditingIndex(i);
    setDraftName(chapters[i]?.name ?? '');
    setDraftAbout(chapters[i]?.about ?? '');
  };

  const cancelEdit = () => setEditingIndex(null);

  const saveEdit = (i) => {
    setChapters((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, name: draftName, about: draftAbout } : c))
    );
    setEditingIndex(null);
  };

  const removeChapter = (i) => {
    setChapters((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addChapter = () => {
    setChapters((prev) => [
      ...prev,
      { name: 'New Chapter', about: 'Describe this chapter...', duration: '10 min' },
    ]);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setChapters((prev) => arrayMove(prev, active.id, over.id));
    }
  };

  const onSaveOutline = () => {
    startSaving(async () => {
      try {
        await saveOutlineAction(
          courseId,
          chapters.map((c) => ({
            name: c.name,
            about: c.about,
            difficulty: c.difficulty,
            learningObjectives: c.learningObjectives,
            prerequisites: c.prerequisites,
          }))
        );
        await reorderChaptersAction(
          courseId,
          chapters.map((_, i) => ({ chapterId: i, orderIndex: i }))
        );
        toast.success('Outline saved');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save outline');
      }
    });
  };

  const onGenerateContent = async () => {
    if (chapters.length === 0) {
      toast.error('Add at least one chapter first');
      return;
    }
    setGenerating(true);
    try {
      await saveOutlineAction(
        courseId,
        chapters.map((c) => ({
          name: c.name,
          about: c.about,
          difficulty: c.difficulty,
          learningObjectives: c.learningObjectives,
          prerequisites: c.prerequisites,
        }))
      );
      await reorderChaptersAction(
        courseId,
        chapters.map((_, i) => ({ chapterId: i, orderIndex: i }))
      );
      await updateCourseStatus(courseId, 'generating_chapters', 35, 'Generating chapter content...');
      await fetch('/api/inngest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'course.generate_chapters', data: { courseId } }),
      });
      router.replace(`/create-course/${courseId}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to start generation');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={chapters.map((_, i) => i)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {chapters.map((ch, i) => (
              <SortableChapter
                key={i}
                ch={ch}
                index={i}
                editingIndex={editingIndex}
                draftName={draftName}
                draftAbout={draftAbout}
                beginEdit={beginEdit}
                saveEdit={saveEdit}
                cancelEdit={cancelEdit}
                removeChapter={removeChapter}
                setDraftName={setDraftName}
                setDraftAbout={setDraftAbout}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {chapters.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-8">No chapters yet.</p>
      )}

      <Button variant="outline" onClick={addChapter} className="mt-4 w-full">
        <HiPlus className="mr-2 h-4 w-4" />
        Add Chapter
      </Button>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Button variant="outline" onClick={onSaveOutline} disabled={saving || generating} className="flex-1">
          {saving ? 'Saving...' : 'Save outline'}
        </Button>
        <Button onClick={onGenerateContent} disabled={saving || generating || chapters.length === 0} className="flex-1">
          <HiSparkles className="mr-2 h-4 w-4" />
          {generating ? 'Starting...' : 'Generate chapter content'}
        </Button>
      </div>
    </div>
  );
}
