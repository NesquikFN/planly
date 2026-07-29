"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Paperclip, X } from "lucide-react";
import { settingsCard, settingsInput, settingsLabel, settingsSectionTitle } from "@/lib/settings-form-styles";
import { FEEDBACK_PRIORITY_OPTIONS } from "@/lib/help-mock-data";
import { writeStorage } from "@/lib/storage";
import type { FeedbackPriority } from "@/types/help";

export type FeedbackType = "Ошибка" | "Предложение" | "Вопрос";

interface HelpFeedbackFormProps {
  initialType?: FeedbackType;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function HelpFeedbackForm({ initialType = "Вопрос" }: HelpFeedbackFormProps) {
  const [type, setType] = useState<FeedbackType>(initialType);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<FeedbackPriority>("medium");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string; description?: string; file?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setType(initialType), [initialType]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = {
      subject: subject.trim() ? undefined : "Укажите тему обращения.",
      description: description.trim() ? undefined : "Опишите обращение подробнее.",
    };
    setErrors(nextErrors);
    if (nextErrors.subject || nextErrors.description) return;

    setIsSubmitting(true);
    window.setTimeout(() => {
      const payload = { type, subject: subject.trim(), description: description.trim(), priority, fileName: attachedFile?.name ?? null, createdAt: new Date().toISOString() };
      writeStorage("planly:help-last-feedback", payload);
      setSubmitted(true);
      setIsSubmitting(false);
      setSubject("");
      setDescription("");
      setPriority("medium");
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 650);
  }

  return (
    <section className={settingsCard}>
      <h3 className={settingsSectionTitle}>Обратная связь</h3>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        Заявка сохраняется только в демо-режиме, без отправки на сервер
      </p>

      {submitted && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 size={16} className="shrink-0" />
          Спасибо! Сообщение сохранено (демо-режим, без реальной отправки).
        </div>
      )}

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className={settingsLabel}>Тип обращения</span>
          <select value={type} onChange={(event) => setType(event.target.value as FeedbackType)} className={settingsInput}>
            <option>Вопрос</option><option>Ошибка</option><option>Предложение</option>
          </select>
        </label>

        <label className="block">
          <span className={settingsLabel}>Тема</span>
          <input
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Кратко опишите тему обращения"
            aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? "feedback-subject-error" : undefined}
            className={`${settingsInput} ${errors.subject ? "border-red-400 focus:ring-red-400" : ""}`}
          />
          {errors.subject && <span id="feedback-subject-error" className="mt-1 block text-xs text-red-500">{errors.subject}</span>}
        </label>

        <label className="block">
          <span className={settingsLabel}>Описание</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Опишите проблему или идею подробнее"
            aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "feedback-description-error" : undefined}
            className={`${settingsInput} resize-none ${errors.description ? "border-red-400 focus:ring-red-400" : ""}`}
          />
          {errors.description && <span id="feedback-description-error" className="mt-1 block text-xs text-red-500">{errors.description}</span>}
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={settingsLabel}>Приоритет</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as FeedbackPriority)}
              className={settingsInput}
            >
              {FEEDBACK_PRIORITY_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="block">
            <span className={settingsLabel}>Вложение</span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && file.size > MAX_FILE_SIZE) { setAttachedFile(null); setErrors((current) => ({ ...current, file: "Файл не должен быть больше 5 МБ." })); event.target.value = ""; return; }
                setAttachedFile(file); setErrors((current) => ({ ...current, file: undefined }));
              }}
            />
            {attachedFile ? (
              <div className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                <span className="truncate">{attachedFile.name} · {(attachedFile.size / 1024).toFixed(1)} КБ</span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  aria-label="Убрать файл"
                  className="shrink-0 rounded-md p-0.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <Paperclip size={14} />
                Прикрепить файл
              </button>
            )}
            {errors.file && <span className="mt-1 block text-xs text-red-500">{errors.file}</span>}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-gray-900"
          >
            {isSubmitting ? "Отправляем…" : "Отправить"}
          </button>
        </div>
      </form>
    </section>
  );
}
