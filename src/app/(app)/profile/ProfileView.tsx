'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Trash2, FolderKanban, FileText, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/store/AppProvider';
import { dashboardStats } from '@/lib/selectors';
import { PageHeader } from '@/components/app/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Field, inputClass, textareaClass } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import styles from './profile.module.css';

interface ProfileForm {
  fullName: string;
  email: string;
  jobTitle: string;
  organization: string;
  bio: string;
  avatarUrl: string | null;
}

const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024;

export function ProfileView() {
  const { data, updateProfile } = useApp();
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileForm>({
    fullName: data.profile.fullName,
    email: data.profile.email,
    jobTitle: data.profile.jobTitle,
    organization: data.profile.organization,
    bio: data.profile.bio,
    avatarUrl: data.profile.avatarUrl,
  });
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      fullName: data.profile.fullName,
      email: data.profile.email,
      jobTitle: data.profile.jobTitle,
      organization: data.profile.organization,
      bio: data.profile.bio,
      avatarUrl: data.profile.avatarUrl,
    });
  }, [data.profile]);

  const stats = dashboardStats(data);
  const dirty =
    form.fullName !== data.profile.fullName ||
    form.email !== data.profile.email ||
    form.jobTitle !== data.profile.jobTitle ||
    form.organization !== data.profile.organization ||
    form.bio !== data.profile.bio ||
    form.avatarUrl !== data.profile.avatarUrl;

  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onAvatarSelected(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify({ tone: 'error', title: 'That file isn’t an image' });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      notify({
        tone: 'error',
        title: 'Image is too large',
        description: 'Pick an image under 1.5 MB — it is stored in this browser.',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('avatarUrl', String(reader.result));
    reader.onerror = () => notify({ tone: 'error', title: 'That image could not be read' });
    reader.readAsDataURL(file);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(null);
    updateProfile(form);
    notify({ tone: 'success', title: 'Profile saved' });
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your details are stored in this browser only and are not sent anywhere."
      />

      <form className={styles.layout} onSubmit={submit} noValidate>
        <section className={styles.card}>
          <div className={styles.avatarRow}>
            <Avatar name={form.fullName || 'You'} src={form.avatarUrl} size={72} />
            <div className={styles.avatarActions}>
              <p className={styles.avatarLabel}>Profile image</p>
              <p className={styles.avatarHint}>PNG or JPG, under 1.5 MB.</p>
              <div className={styles.avatarButtons}>
                <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                  <Camera size={14} aria-hidden />
                  {form.avatarUrl ? 'Replace' : 'Upload'}
                </Button>
                {form.avatarUrl ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => set('avatarUrl', null)}>
                    <Trash2 size={14} aria-hidden />
                    Remove
                  </Button>
                ) : null}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="srOnly"
                aria-label="Upload profile image"
                onChange={(e) => {
                  onAvatarSelected(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          <div className={styles.fields}>
            <Field label="Full name">
              {(props) => (
                <input
                  {...props}
                  className={inputClass}
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  autoComplete="name"
                  maxLength={80}
                />
              )}
            </Field>

            <Field label="Email" error={emailError ?? undefined}>
              {(props) => (
                <input
                  {...props}
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => {
                    set('email', e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  autoComplete="email"
                />
              )}
            </Field>

            <Field label="Job title">
              {(props) => (
                <input
                  {...props}
                  className={inputClass}
                  value={form.jobTitle}
                  onChange={(e) => set('jobTitle', e.target.value)}
                  placeholder="Senior Software Engineer"
                  maxLength={80}
                />
              )}
            </Field>

            <Field label="Organization">
              {(props) => (
                <input
                  {...props}
                  className={inputClass}
                  value={form.organization}
                  onChange={(e) => set('organization', e.target.value)}
                  placeholder="Independent"
                  maxLength={80}
                />
              )}
            </Field>

            <div className={styles.fullWidth}>
              <Field
                label="About you"
                hint="A short description of what you work on. Not used in AI analysis."
              >
                {(props) => (
                  <textarea
                    {...props}
                    className={textareaClass}
                    value={form.bio}
                    onChange={(e) => set('bio', e.target.value)}
                    rows={3}
                    maxLength={400}
                  />
                )}
              </Field>
            </div>
          </div>

          <footer className={styles.formFooter}>
            <p className={styles.dirtyHint} role="status">
              {dirty ? 'You have unsaved changes.' : 'All changes saved.'}
            </p>
            <div className={styles.footerButtons}>
              <Button
                type="button"
                variant="ghost"
                disabled={!dirty}
                onClick={() =>
                  setForm({
                    fullName: data.profile.fullName,
                    email: data.profile.email,
                    jobTitle: data.profile.jobTitle,
                    organization: data.profile.organization,
                    bio: data.profile.bio,
                    avatarUrl: data.profile.avatarUrl,
                  })
                }
              >
                Discard
              </Button>
              <Button type="submit" variant="primary" disabled={!dirty}>
                Save changes
              </Button>
            </div>
          </footer>
        </section>

        <aside className={styles.side}>
          <div className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Your workspace</h2>
            <ul className={styles.sideStats}>
              <li>
                <FolderKanban size={15} aria-hidden />
                <span>{stats.topicCount}</span> active topics
              </li>
              <li>
                <FileText size={15} aria-hidden />
                <span>{stats.documentCount}</span> documents
              </li>
              <li>
                <Sparkles size={15} aria-hidden />
                <span>{stats.openRecommendationCount}</span> open recommendations
              </li>
            </ul>
            <p className={styles.sideNote}>Workspace created {formatDate(data.profile.createdAt)}.</p>
          </div>
        </aside>
      </form>
    </>
  );
}
