import { Page } from '../components/Page';
import { ScenePreview } from '../components/ScenePreview';

export default function Adventure() {
  return (
    <Page
      eyebrow="Outside, together"
      title="The world is waiting."
      description="Your little companion will discover stories wherever life takes you."
    >
      <ScenePreview kind="adventure" />
    </Page>
  );
}
