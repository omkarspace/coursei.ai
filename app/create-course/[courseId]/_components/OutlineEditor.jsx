'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { HiPencil, HiTrash, HiCheck, HiX, HiSparkles } from 'react-icons/hi2';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveOutlineAction } from '@/app/actions/outline';
import { updateCourseStatus } from '@/app/actions/course';

export default function OutlineEditor({ courseId, initialChapters }) {
  const router = useRouter();
  const [chapters, setChapters] = useState(initialChapters);
  const [editingIndex, setEditingIndex] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [draftAbout, setDraftAbout] = useState('');
  const [saving, startSaving] = useTransition();
  const [generating, setGenerating] = useState(false);

  const beginEdit = (i) => {
    setEditingIndex(i);
    setDraftName(chapters[i]?.name ?? '');
    setDraftAbout(chapters[i]?.about ?? '');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  const saveEdit = (i) => {
    setChapters((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, name: draftName, about: draftAbout } : c))
    );
    setEditingIndex(null);
  };

  const removeChapter = (i) => {
    setChapters((prev) => prev.filter((_, idx) => idx !== i));
  };

  const onSaveOutline = () => {
    startSaving(async () => {
      try {
        await saveOutlineAction(
          courseId,
          chapters.map((c) => ({ name: c.name, about: c.about }))
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
        chapters.map((c) => ({ name: c.name, about: c.about }))
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
      <div className="space-y-3">
        {chapters.map((ch, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div className="flex-1">
                {editingIndex === i ? (
                  <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                ) : (
                  <h4 className="font-semibold text-base">
                    {i + 1}. {ch.name}
                  </h4>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Duration: {ch.duration}
                </p>
              </div>
              <div className="flex gap-1">
                {editingIndex === i ? (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => saveEdit(i)}
                      aria-label="Save"
                    >
                      <HiCheck className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelEdit}
                      aria-label="Cancel"
                    >
                      <HiX className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => beginEdit(i)}
                      aria-label="Edit chapter"
                    >
                      <HiPencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeChapter(i)}
                      aria-label="Remove chapter"
                    >
                      <HiTrash className="h-4 w-4 text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingIndex === i ? (
                <Textarea
                  value={draftAbout}
                  onChange={(e) => setDraftAbout(e.target.value)}
                  rows={3}
                />
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">{ch.about}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {chapters.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-8">No chapters yet.</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Button
          variant="outline"
          onClick={onSaveOutline}
          disabled={saving || generating}
          className="flex-1"
        >
          {saving ? 'Saving...' : 'Save outline'}
        </Button>
        <Button
          onClick={onGenerateContent}
          disabled={saving || generating || chapters.length === 0}
          className="flex-1"
        >
          <HiSparkles className="mr-2 h-4 w-4" />
          {generating ? 'Starting...' : 'Generate chapter content'}
        </Button>
      </div>
    </div>
  );
}
