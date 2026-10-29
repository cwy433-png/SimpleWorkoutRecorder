import React, { useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { useDialog } from '../../components/ui/Dialog';
import { readHistory } from '../history/historyStore';
import { AI_PROMPT, buildAiExport, createBackup, localDateStamp, restoreBackup } from './dataExport';

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function readPlans() {
  try {
    const plans = JSON.parse(localStorage.getItem('workout_plans') || '[]');
    return Array.isArray(plans) ? plans : [];
  } catch {
    return [];
  }
}

const SectionLabel = ({ children }) => (
  <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">{children}</div>
);

export const DataView = () => {
  const dialog = useDialog();
  const fileRef = useRef(null);

  const exportForAi = () => {
    const now = Date.now();
    downloadJson(buildAiExport(readHistory(localStorage), readPlans(), now), `workout-recorder-ai-${localDateStamp(now)}.json`);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      dialog.notify('PROMPT COPIED');
    } catch {
      dialog.notify('COPY FAILED', { tone: 'danger' });
    }
  };

  const exportBackup = () => {
    const now = Date.now();
    downloadJson(createBackup(localStorage, now), `workout-recorder-backup-${localDateStamp(now)}.json`);
  };

  const onFileChosen = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = ''; // allow choosing the same file again
    if (!file) return;

    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      dialog.notify('INVALID BACKUP FILE', { tone: 'danger' });
      return;
    }

    const ok = await dialog.confirm({
      title: 'RESTORE BACKUP',
      message: 'This replaces your current history, plans and settings with the contents of the backup.',
      confirmLabel: 'RESTORE',
      tone: 'danger',
    });
    if (!ok) return;

    const written = restoreBackup(data, localStorage);
    if (written.length === 0) {
      dialog.notify('NOT A BACKUP FILE', { tone: 'danger' });
      return;
    }
    dialog.notify('BACKUP RESTORED');
    setTimeout(() => window.location.reload(), 900);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <PageHeader tag="DATA" title="Export" sub="TAKE YOUR DATA ANYWHERE" />

      <div className="flex flex-col gap-6 px-4 py-4">
        <section>
          <SectionLabel>EXPORT FOR AI</SectionLabel>
          <Button label="TRAINING LOG · JSON" onClick={exportForAi}>EXPORT FOR AI</Button>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-text-muted">
            Session times carry a UTC offset, so an AI can match them to your Garmin activities.
          </p>
          <div className="mt-1">
            <Button variant="link" onClick={copyPrompt}>COPY PROMPT</Button>
          </div>
        </section>

        <section>
          <SectionLabel>BACKUP</SectionLabel>
          <Button label="HISTORY · PLANS · SETTINGS" onClick={exportBackup}>BACKUP</Button>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] leading-relaxed text-text-muted">
              Restoring replaces the data on this device.
            </p>
            <Button variant="link" tone="danger" onClick={() => fileRef.current?.click()}>RESTORE</Button>
          </div>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onFileChosen} />
        </section>
      </div>
    </div>
  );
};
