import type { Metadata } from 'next';
import { TopicWorkspace } from './TopicWorkspace';

export const metadata: Metadata = { title: 'Topic' };

export default async function TopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  return <TopicWorkspace topicId={topicId} />;
}
