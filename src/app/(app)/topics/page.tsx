import type { Metadata } from 'next';
import { TopicsView } from './TopicsView';

export const metadata: Metadata = { title: 'Topics' };

export default function TopicsPage() {
  return <TopicsView />;
}
