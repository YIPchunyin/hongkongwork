import { Metadata } from 'next';
import ShareView from './ShareView';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const res = await fetch(process.env.NEXT_PUBLIC_BASE_URL + '/api/notes/share/' + id, { next: { revalidate: 0 } });
    const json = await res.json();
    if (json.success) {
      const note = json.data;
      const title = note.title || '分享的记事';
      const desc = note.content || '查看分享内容';
      const imageUrl = note.images?.[0]?.url || '';
      return {
        title: title + ' - 分享',
        description: desc.substring(0, 200),
        openGraph: {
          title,
          description: desc.substring(0, 200),
          type: 'article',
          images: imageUrl ? [{ url: imageUrl }] : [],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description: desc.substring(0, 200),
          images: imageUrl ? [imageUrl] : [],
        },
      };
    }
  } catch {}
  return { title: '分享 - 港工生活' };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  return <ShareView id={id} />;
}
