import type { Metadata } from 'next';
import { DocumentDetail } from './DocumentDetail';

export const metadata: Metadata = { title: 'Document' };

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  return <DocumentDetail documentId={documentId} />;
}
