import { Page } from '../components/Page';
import { ScenePreview } from '../components/ScenePreview';

export default function Friends() {
  return (
    <Page
      eyebrow="A world of friends"
      title="Better together."
      description="The friends your companion meets will become part of its story."
    >
      <ScenePreview kind="friends" />
    </Page>
  );
}
