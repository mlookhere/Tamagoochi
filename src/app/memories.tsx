import { Page } from '../components/Page';
import { ScenePreview } from '../components/ScenePreview';

export default function Memories() {
  return (
    <Page
      eyebrow="Our little history"
      title="A life in little moments."
      description="A home for every place, first, and keepsake you share."
    >
      <ScenePreview kind="memories" />
    </Page>
  );
}
