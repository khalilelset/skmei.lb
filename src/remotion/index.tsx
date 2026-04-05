import { Composition, registerRoot } from "remotion";
import { WatchTransition } from "./WatchTransition";

const RemotionRoot = () => {
  return (
    <Composition
      id="WatchTransition"
      component={WatchTransition}
      durationInFrames={90}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

registerRoot(RemotionRoot);
